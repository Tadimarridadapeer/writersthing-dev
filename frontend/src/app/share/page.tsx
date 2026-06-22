"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SharePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/write");
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4 animate-pulse">Redirecting to publishing studio...</p>
      </div>
    </div>
  );
}
