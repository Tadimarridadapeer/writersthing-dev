import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type DraftStatus = 'idle' | 'saving' | 'saved' | 'failed' | 'unsaved';

export interface DraftPayload {
  id?: string;
  type: "Book" | "Blog" | "Story" | "Magazine";
  title: string;
  description?: string;
  content: string;
  category: string;
  coverUrl?: string;
  coverFile?: File | null;
  pdfFile?: File | null;
  tags?: string[];
  price?: string;
}

export function useDraftManager(type: "Book" | "Blog" | "Story" | "Magazine" | null, draftId: string | null) {
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(draftId);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Ref to hold the latest payload so timeout can access it without closure stall
  const latestPayload = useRef<DraftPayload | null>(null);
  const lastSavedPayloadStr = useRef<string>("");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const continuousTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Local Storage Key
  const localKey = type ? `wt_draft_${type.toLowerCase()}_user_${currentId || 'new'}` : null;

  // 1. Recover from Local Storage on mount
  const recoverLocalDraft = useCallback(() => {
    if (!localKey) return null;
    const stored = localStorage.getItem(localKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Local draft parsing failed", e);
      }
    }
    return null;
  }, [localKey]);

  // 2. Persist to Local Storage instantly
  const persistLocal = useCallback((payload: Omit<DraftPayload, 'coverFile' | 'pdfFile'>) => {
    if (!localKey) return;
    localStorage.setItem(localKey, JSON.stringify(payload));
  }, [localKey]);

  const clearLocal = useCallback(() => {
    if (localKey) localStorage.removeItem(localKey);
  }, [localKey]);

  // 3. Unload Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'unsaved' || status === 'saving') {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  const currentIdRef = useRef<string | null>(draftId);
  const savePromiseRef = useRef<Promise<any> | null>(null);
  const hasPublishedRef = useRef<boolean>(false);

  // Keep state in sync with ref for UI
  useEffect(() => {
    currentIdRef.current = draftId;
    setCurrentId(draftId);
    hasPublishedRef.current = false;
  }, [draftId, type]);

  // 4. Supabase API Save Function
  const saveToDatabase = useCallback(async (payload: DraftPayload, isPublishing: boolean = false) => {
    // If we've already successfully published, do not process any lagging autosaves
    if (!isPublishing && hasPublishedRef.current) {
      return currentIdRef.current;
    }

    if (isPublishing) {
      if (!payload.coverFile && !payload.coverUrl && !currentIdRef.current && payload.type === 'Book') {
        throw new Error("Please upload a cover/image before publishing.");
      }
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (continuousTimerRef.current) clearTimeout(continuousTimerRef.current);
    }

    // If there is already a save in progress, wait for it
    if (savePromiseRef.current) {
      try { await savePromiseRef.current; } catch (e) {}
    }

    const executeSave = async () => {
      setStatus('saving');
      setErrorMessage("");

      try {
        // Handle Story and Blog image upload via backend API (service role bypasses RLS)
        if (payload.coverFile && payload.type !== "Book") {
          const formData = new FormData();
          formData.append("file", payload.coverFile);
          formData.append("type", payload.type);

          const uploadRes = await fetch("/api/stories/upload-cover", {
            method: "POST",
            body: formData
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json().catch(() => ({ message: "Cover upload failed" }));
            throw new Error("Image Upload Failed: " + (err.message || "Unknown error"));
          }

          const { publicUrl } = await uploadRes.json();
          payload.coverUrl = publicUrl;
        }

        const endpoint = payload.type === "Book" ? "/api/books/upload" : "/api/stories";
        const method = currentIdRef.current ? "PUT" : "POST";

        let body: any;
        const headers: any = {
          "X-Publish": isPublishing ? "true" : "false"
        };

        if (payload.type === "Book") {
          headers["Content-Type"] = "application/json";
          
          const payloadObj: any = {
            id: currentIdRef.current,
            title: payload.title,
            description: payload.description || "",
            category: payload.category,
            price: payload.price
          };

          if (isPublishing) {
            payloadObj.requestPresignedUrls = true;
            if (payload.coverFile) {
              payloadObj.coverName = payload.coverFile.name;
              payloadObj.coverType = payload.coverFile.type;
            }
            if (payload.pdfFile) {
              payloadObj.pdfName = payload.pdfFile.name;
              payloadObj.pdfType = payload.pdfFile.type;
              payloadObj.pdfSize = payload.pdfFile.size;
            }
          }
          
          body = JSON.stringify(payloadObj);
        } else {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify({
            id: currentIdRef.current,
            type: payload.type,
            title: payload.title,
            description: payload.description,
            content: payload.content,
            category: payload.category,
            coverUrl: payload.coverUrl,
            tags: payload.tags || []
          });
        }

        const res = await fetch(endpoint, { method, headers, body });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to save draft");
        }

        // First time save generates an ID
        if (!currentIdRef.current && data.id) {
          currentIdRef.current = data.id;
          setCurrentId(data.id);
        } else if (!currentIdRef.current && data.bookId) {
          currentIdRef.current = data.bookId;
          setCurrentId(data.bookId);
        }

        if (isPublishing && data.uploadUrls) {
          // Upload directly to Supabase via presigned URLs
          if (payload.coverFile && data.uploadUrls.cover) {
            await fetch(data.uploadUrls.cover, { method: "PUT", body: payload.coverFile, headers: { "Content-Type": payload.coverFile.type } });
          }
          if (payload.pdfFile && data.uploadUrls.pdf) {
            await fetch(data.uploadUrls.pdf, { method: "PUT", body: payload.pdfFile, headers: { "Content-Type": payload.pdfFile.type } });
          }

          // Finalize publish
          const finalizeRes = await fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "X-Publish": "true" },
            body: JSON.stringify({
              id: data.bookId || currentIdRef.current,
              title: payload.title,
              description: payload.description || "",
              category: payload.category,
              price: payload.price,
              finalize: true,
              coverPath: data.coverPath,
              pdfPath: data.pdfPath,
            })
          });
          const finalizeData = await finalizeRes.json();
          if (!finalizeRes.ok) throw new Error(finalizeData.message || "Failed to finalize publish");
        }

        setStatus('saved');
        setLastSaved(new Date());
        
        lastSavedPayloadStr.current = JSON.stringify({
          title: payload.title,
          description: payload.description,
          content: payload.content,
          category: payload.category
        });

        if (isPublishing) {
          hasPublishedRef.current = true;
          clearLocal();
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
          if (continuousTimerRef.current) clearTimeout(continuousTimerRef.current);
        }

        return data.id || data.bookId || currentIdRef.current;

      } catch (err: any) {
        console.error(err);
        setStatus('failed');
        setErrorMessage(err.message);
        throw err;
      }
    };

    const promise = executeSave();
    savePromiseRef.current = promise;
    try {
      const res = await promise;
      return res;
    } finally {
      if (savePromiseRef.current === promise) {
        savePromiseRef.current = null;
      }
    }
  }, [clearLocal]);

  // 5. Trigger Auto Save
  const triggerAutoSave = useCallback((payload: DraftPayload) => {
    if (!payload.title && !payload.content) return; // Don't save completely empty drafts

    const currentStr = JSON.stringify({
      title: payload.title,
      description: payload.description,
      content: payload.content,
      category: payload.category
    });

    // Don't network save if nothing actually changed
    if (currentStr === lastSavedPayloadStr.current) {
      return; 
    }

    setStatus('unsaved');
    latestPayload.current = payload;
    
    // Save to local storage instantly
    persistLocal({
      title: payload.title,
      description: payload.description,
      content: payload.content,
      category: payload.category,
      type: payload.type,
      id: currentId || undefined
    });

    // Debounce: 5 seconds after typing stops
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (latestPayload.current) {
        saveToDatabase(latestPayload.current, false).catch(() => {});
      }
    }, 5000);

    // Throttle: Max 60 seconds continuous
    if (!continuousTimerRef.current) {
      continuousTimerRef.current = setTimeout(() => {
        if (latestPayload.current) {
          saveToDatabase(latestPayload.current, false).catch(() => {});
        }
        continuousTimerRef.current = null;
      }, 60000);
    }
  }, [saveToDatabase, persistLocal, currentId]);

  return {
    status,
    lastSaved,
    errorMessage,
    currentId,
    triggerAutoSave,
    saveToDatabase,
    recoverLocalDraft,
    clearLocal
  };
}
