import { useState, useEffect, useRef, useCallback } from 'react';

export type ContentType = 'book' | 'blog' | 'story' | 'article';

interface ReadingProgressData {
  id?: string;
  progress_percentage: number;
  last_position: number;
  current_page?: number;
  total_pages?: number;
  completed: boolean;
  reading_time_seconds: number;
  updated_at?: string;
}

export function useReadingProgress(contentId: string, contentType: ContentType) {
  const [initialData, setInitialData] = useState<ReadingProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Real-time tracking
  const [progress, setProgress] = useState(0);
  
  // Refs for tracking without triggering re-renders
  const latestDataRef = useRef<ReadingProgressData>({
    progress_percentage: 0,
    last_position: 0,
    completed: false,
    reading_time_seconds: 0
  });
  
  const serverUpdatedAt = useRef<string>(new Date().toISOString());
  const activeSessionSeconds = useRef<number>(0);
  const lastSavedProgressRef = useRef<number>(-1);
  const lastSavedPageRef = useRef<number | undefined>(undefined);
  
  // Active/Idle states
  const isActiveRef = useRef<boolean>(true);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch initial progress
  useEffect(() => {
    if (!contentId || !contentType) return;
    
    let isMounted = true;
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/reading-progress?contentId=${contentId}&contentType=${contentType}`);
        if (res.ok) {
          const { data } = await res.json();
          if (data && isMounted) {
            setInitialData(data);
            serverUpdatedAt.current = data.updated_at;
            latestDataRef.current.progress_percentage = data.progress_percentage;
            latestDataRef.current.last_position = data.last_position;
            latestDataRef.current.current_page = data.current_page;
            lastSavedProgressRef.current = data.progress_percentage;
            lastSavedPageRef.current = data.current_page;
          }
        }
      } catch (err) {
        console.error("Failed to fetch reading progress", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchProgress();
    return () => { isMounted = false; };
  }, [contentId, contentType]);

  // Network Save
  const saveProgress = useCallback(async (force = false) => {
    const currentProg = latestDataRef.current.progress_percentage;
    const currentPage = latestDataRef.current.current_page;
    
    const progDiff = Math.abs(currentProg - lastSavedProgressRef.current);
    const pageChanged = currentPage !== lastSavedPageRef.current;
    
    // Only save if meaningful change or forced (e.g. unmount)
    if (!force && progDiff < 2 && !pageChanged && activeSessionSeconds.current < 5) return;
    if (activeSessionSeconds.current === 0 && progDiff === 0) return; // Nothing to save
    
    try {
      const payload = {
        content_id: contentId,
        content_type: contentType,
        progress_percentage: currentProg,
        last_position: latestDataRef.current.last_position,
        current_page: currentPage,
        total_pages: latestDataRef.current.total_pages,
        reading_time_seconds: activeSessionSeconds.current,
        updated_at: serverUpdatedAt.current,
        device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      };
      
      // Reset local session seconds since we are sending it
      activeSessionSeconds.current = 0;
      lastSavedProgressRef.current = currentProg;
      lastSavedPageRef.current = currentPage;
      
      const res = await fetch("/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const { data, conflict } = await res.json();
        if (!conflict && data) {
          serverUpdatedAt.current = data.updated_at; // Update our conflict token
        }
      }
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  }, [contentId, contentType]);

  // Scroll Tracking (for HTML readers like blogs/stories)
  useEffect(() => {
    const handleScroll = () => {
      // Reset idle timer on interaction
      markActive();
      
      // Calculate scroll progress
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // If content is shorter than screen, 100%
      if (documentHeight <= windowHeight) {
        latestDataRef.current.progress_percentage = 100;
        latestDataRef.current.last_position = 0;
        setProgress(100);
        return;
      }
      
      const maxScroll = documentHeight - windowHeight;
      const rawProgress = (scrollY / maxScroll) * 100;
      const clamped = Math.min(100, Math.max(0, Math.round(rawProgress)));
      
      latestDataRef.current.progress_percentage = clamped;
      latestDataRef.current.last_position = scrollY;
      setProgress(clamped);
    };
    
    const throttledScroll = () => {
      if (!window.requestAnimationFrame) {
        handleScroll();
      } else {
        window.requestAnimationFrame(handleScroll);
      }
    };
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  // Update Page Number explicitly (for PDF reader)
  const updatePageProgress = useCallback((currentPage: number, totalPages: number) => {
    markActive();
    const pct = Math.round((currentPage / Math.max(1, totalPages)) * 100);
    latestDataRef.current.progress_percentage = pct;
    latestDataRef.current.current_page = currentPage;
    latestDataRef.current.total_pages = totalPages;
    setProgress(pct);
  }, []);

  // Active Time Tracking
  const markActive = () => {
    isActiveRef.current = true;
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    
    // Set to idle after 60 seconds of no interaction
    idleTimeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
    }, 60000);
  };
  
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, markActive, { passive: true }));
    
    const handleVisibilityChange = () => {
      if (document.hidden) isActiveRef.current = false;
      else markActive();
    };
    
    const handleBlur = () => { isActiveRef.current = false; };
    const handleFocus = () => { markActive(); };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    // Accumulate seconds
    activeIntervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        activeSessionSeconds.current += 1;
      }
    }, 1000);
    
    // Periodic Save every 30 seconds
    saveIntervalRef.current = setInterval(() => {
      saveProgress(false);
    }, 30000);
    
    return () => {
      events.forEach(e => window.removeEventListener(e, markActive));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (activeIntervalRef.current) clearInterval(activeIntervalRef.current);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      
      // Save on unmount
      saveProgress(true);
    };
  }, [saveProgress]);

  // Resume method for the UI button
  const resume = useCallback(() => {
    if (initialData) {
      if (initialData.last_position > 0) {
        window.scrollTo({ top: initialData.last_position, behavior: 'smooth' });
      }
    }
  }, [initialData]);

  return {
    progress,
    initialData,
    loading,
    resume,
    updatePageProgress
  };
}
