import React from "react";

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

  const getInitials = (fullName?: string) => {
    if (!fullName) return "U";
    const cleanName = fullName.includes('@') ? fullName.split('@')[0] : fullName;
    const parts = cleanName.trim().split(/\s+/).filter(Boolean);
    
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    if (parts.length === 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className={`w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-white text-[9px] font-black`}
        title={name && !name.includes('@') ? name : "Author"}
      >
        {initials}
      </div>
    </div>
  );
}
