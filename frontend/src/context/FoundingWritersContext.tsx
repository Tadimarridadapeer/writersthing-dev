"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface FoundingWritersContextType {
  founderMap: Record<string, number>; // Maps user_id to founder_number
  loading: boolean;
}

const FoundingWritersContext = createContext<FoundingWritersContextType>({
  founderMap: {},
  loading: true,
});

export function FoundingWritersProvider({ children }: { children: React.ReactNode }) {
  const [founderMap, setFounderMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFounders() {
      try {
        const { data, error } = await supabase
          .from("user_badges")
          .select("user_id, badge_number")
          .eq("badge_type", "founding_writer");

        if (error) {
          console.error("Error fetching founding writers:", error);
          return;
        }

        if (data) {
          const map: Record<string, number> = {};
          data.forEach((badge: any) => {
            map[badge.user_id] = badge.badge_number;
          });
          setFounderMap(map);
        }
      } catch (err) {
        console.error("Failed to load founding writers map:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFounders();
  }, []);

  return (
    <FoundingWritersContext.Provider value={{ founderMap, loading }}>
      {children}
    </FoundingWritersContext.Provider>
  );
}

export const useFoundingWriters = () => useContext(FoundingWritersContext);
