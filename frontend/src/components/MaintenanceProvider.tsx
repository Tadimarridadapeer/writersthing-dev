"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ServerCrash, Loader2 } from "lucide-react";

export default function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("*")
          .eq("id", 1)
          .maybeSingle();

        if (data && !error) {
          setIsMaintenanceMode(data.is_maintenance_mode);
          setMaintenanceMessage(data.maintenance_message);
        }
      } catch (err) {
        console.error("Failed to check maintenance mode:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Set up realtime listener for immediate toggling
    const channel = supabase
      .channel("platform_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "platform_settings",
          filter: "id=eq.1",
        },
        (payload: any) => {
          setIsMaintenanceMode(payload.new.is_maintenance_mode);
          setMaintenanceMessage(payload.new.maintenance_message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    // Optionally return nothing or a loader to prevent a flash of content
    // But since the app handles its own loading screen, we can just return children until we know for sure
  }

  if (isMaintenanceMode) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute top-8 left-8">
          <p className="font-bodoni-moda text-xl font-bold italic tracking-tight text-black dark:text-white">
            Writer's Thing
          </p>
        </div>
        
        <div className="w-20 h-20 mb-8 flex items-center justify-center text-zinc-900 dark:text-white">
          <ServerCrash strokeWidth={1} className="w-16 h-16 opacity-50" />
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-medium tracking-tight text-black dark:text-white mb-6">
          System Maintenance
        </h1>
        
        <div className="w-12 h-px bg-zinc-300 dark:bg-zinc-800 mx-auto mb-8"></div>
        
        <p className="text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto mb-12 font-inter text-lg md:text-xl leading-relaxed">
          {maintenanceMessage || "We are currently upgrading our systems to provide you with a better experience. We will be back shortly."}
        </p>
        
        <div className="flex items-center gap-3 text-xs tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 font-medium">
          <span className="w-8 h-px bg-zinc-200 dark:bg-zinc-800"></span>
          Writer's Thing Team
          <span className="w-8 h-px bg-zinc-200 dark:bg-zinc-800"></span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
