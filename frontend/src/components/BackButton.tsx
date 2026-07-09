"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function BackButton() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // A simple heuristic to check if we navigated from within the app
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
      setCanGoBack(true);
    }
  }, []);

  const handleBack = () => {
    if (canGoBack) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <button 
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors focus-visible:ring-2 focus-visible:ring-black outline-none rounded-sm p-1 -ml-1"
      aria-label="Go back"
    >
      <ArrowLeft size={14} /> Back
    </button>
  );
}
