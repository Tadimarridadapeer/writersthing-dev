import React from "react";
import Image from "next/image";

interface FoundingBadgeProps {
  founderNumber: number | null;
  isFoundingWriter: boolean;
  className?: string; // Optional classes to position the badge (e.g., 'absolute -bottom-2 -right-2')
  size?: number; // Size of the badge in pixels
}

export default function FoundingBadge({ 
  founderNumber, 
  isFoundingWriter, 
  className = "absolute -bottom-1 -right-1",
  size = 24
}: FoundingBadgeProps) {
  if (!isFoundingWriter || !founderNumber) return null;

  return (
    <div className={`group relative inline-flex items-center justify-center ${className}`}>
      {/* Badge Image */}
      <img
        src="/Badget/founding_badget.png"
        alt="Founding Writer Badge"
        className="object-contain drop-shadow-sm transition-transform group-hover:scale-110"
        style={{ width: size, height: size }}
      />
      
      {/* Tooltip on Hover */}
      <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        <div className="bg-black text-white text-xs rounded-lg p-3 shadow-xl border border-zinc-800 text-center">
          <p className="font-black uppercase tracking-widest text-amber-500 mb-1">Founding Writer</p>
          <p className="text-lg font-mono font-bold mb-1">#{String(founderNumber).padStart(3, '0')}</p>
          <p className="text-[10px] text-zinc-400 leading-tight">
            One of the first 100 Founding Writers
          </p>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      </div>
    </div>
  );
}
