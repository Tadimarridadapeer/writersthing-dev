import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

// We store the session ID in sessionStorage so it persists for the tab session
// This allows us to track unique readers properly per session
const getSessionId = () => {
  if (typeof window === "undefined") return null;
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

export const useAnalyticsTracking = (contentType: "book" | "story" | "blog", contentId: string) => {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per mount
    if (tracked.current || !contentId) return;
    tracked.current = true;

    const trackView = async () => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentType,
            contentId,
            referrer: document.referrer,
            sessionId: getSessionId(),
          }),
        });
      } catch (err) {
        console.error("Failed to track analytics:", err);
      }
    };

    // Use a slight delay to ensure they are actually reading it (e.g. 3 seconds)
    // and not just bouncing immediately
    const timeout = setTimeout(() => {
      trackView();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [contentType, contentId]);
};
