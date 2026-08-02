import React from "react";
import { OptimizedImage } from "./OptimizedImage";
import FoundingBadge from "./ui/FoundingBadge";
import { useFoundingWriters } from "@/context/FoundingWritersContext";

interface AvatarWithBadgeProps {
  userId?: string;
  avatarUrl?: string;
  name?: string;
  className?: string; // e.g., 'w-8 h-8 rounded-full'
}

export default function AvatarWithBadge({ userId, avatarUrl, name, className = "w-[22px] h-[22px] rounded-full" }: AvatarWithBadgeProps) {
  const { founderMap } = useFoundingWriters();
  const founderNumber = userId ? founderMap[userId] : undefined;
  const isFoundingWriter = !!founderNumber;

  return (
    <div className={`relative inline-block ${className}`}>
      {avatarUrl ? (
        <OptimizedImage
          src={avatarUrl}
          className={`w-full h-full rounded-full border border-zinc-100 shadow-sm`}
          imageClassName="grayscale hover:grayscale-0 transition-all duration-300"
          alt="Avatar"
          variant="profile"
        />
      ) : (
        <div className={`w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-white text-[9px] font-black`}>
          {(name || "U").charAt(0).toUpperCase()}
        </div>
      )}

      {isFoundingWriter && (
        <FoundingBadge 
          isFoundingWriter={isFoundingWriter} 
          founderNumber={founderNumber} 
          className="absolute -bottom-1 -right-1" 
          size={Math.max(16, parseInt(className.match(/w-\[(\d+)px\]/)?.[1] || "24") * 0.4)}
        />
      )}
    </div>
  );
}
