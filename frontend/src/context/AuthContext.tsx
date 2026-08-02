"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import FoundingWriterModal from "@/components/ui/FoundingWriterModal";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [showFounderModal, setShowFounderModal] = useState(false);
  const [founderNumber, setFounderNumber] = useState<number>(0);

  const checkFoundingWriterStatus = async (userEmail: string, userId: string) => {
    try {
      const res = await fetch("/api/user/sync-founder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, userId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isFounder && data.justAccepted) {
          setFounderNumber(data.founderNumber);
          setShowFounderModal(true);
        }
      }
    } catch (err) {
      console.error("Error checking founder status:", err);
    }
  };

  useEffect(() => {
    // 1. Check active sessions
    const setData = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        console.log("Auth Session Init:", session?.user?.email);
        setSession(session);
        setUser(session?.user || null);

        if (session?.user?.email) {
          checkFoundingWriterStatus(session.user.email, session.user.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    setData();

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
      
      if (_event === 'SIGNED_IN') {
        if (session?.user?.email) {
          checkFoundingWriterStatus(session.user.email, session.user.id);
        }
      }
      
      if (_event === 'SIGNED_OUT') {
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const value = {
    user,
    session,
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <FoundingWriterModal 
        isOpen={showFounderModal} 
        onClose={() => setShowFounderModal(false)} 
        founderNumber={founderNumber} 
      />
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
