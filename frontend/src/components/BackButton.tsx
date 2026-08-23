"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function BackButton() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // document.referrer does not update during Next.js client-side navigation.
    // Instead, we can check if the Next.js history state index is > 0, 
    // or if window.history.length > 2 (which implies internal navigation in a tab).
    const isNextJsInternalNav = window.history.state && window.history.state.idx > 0;
    const isHistoryLong = window.history.length > 2;
    const isReferrerInternal = document.referrer.includes(window.location.host);
    
    if (isNextJsInternalNav || isHistoryLong || isReferrerInternal) {
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
