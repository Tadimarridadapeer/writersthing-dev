import { useState, useEffect, useRef, useCallback } from 'react';

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
  const localKey = type ? `wt_draft_${type.toLowerCase()}_${currentId || 'new'}` : null;

  // 1. Recover from Local Storage on mount
  const recoverLocalDraft = () => {
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
  };

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

  // Keep state in sync with ref for UI
  useEffect(() => {
    currentIdRef.current = draftId;
    setCurrentId(draftId);
  }, [draftId]);

  // 4. Supabase API Save Function
  const saveToDatabase = useCallback(async (payload: DraftPayload, isPublishing: boolean = false) => {
    // If there is already a save in progress, wait for it
    if (savePromiseRef.current) {
      try { await savePromiseRef.current; } catch (e) {}
    }

    const executeSave = async () => {
      setStatus('saving');
      setErrorMessage("");

      try {
        const endpoint = payload.type === "Book" ? "/api/books/upload" : "/api/stories";
        const method = currentIdRef.current ? "PUT" : "POST";

        let body: any;
        let headers: any = {
          "X-Publish": isPublishing ? "true" : "false"
        };

        if (payload.type === "Book") {
          const formData = new FormData();
          if (currentIdRef.current) formData.append("id", currentIdRef.current);
          formData.append("title", payload.title);
          formData.append("description", payload.description || "");
          formData.append("category", payload.category);
          if (payload.coverFile) formData.append("coverFile", payload.coverFile);
          if (payload.pdfFile) formData.append("pdfFile", payload.pdfFile);
          body = formData;
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

        setStatus('saved');
        setLastSaved(new Date());
        
        lastSavedPayloadStr.current = JSON.stringify({
          title: payload.title,
          description: payload.description,
          content: payload.content,
          category: payload.category
        });

        if (isPublishing) clearLocal();

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
