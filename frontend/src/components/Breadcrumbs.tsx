"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import React from "react";

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  if (!pathname || pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
      <Link href="/" className="hover:text-black transition-colors focus-visible:ring-2 focus-visible:ring-black outline-none rounded-sm">
        Home
      </Link>
      
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        
        // Format segment: "city-libraries" -> "City Libraries"
        const formattedSegment = segment
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return (
          <React.Fragment key={href}>
            <ChevronRight size={12} className="text-zinc-300" />
            {isLast ? (
              <span className="text-black" aria-current="page">
                {formattedSegment}
              </span>
            ) : (
              <Link href={href} className="hover:text-black transition-colors focus-visible:ring-2 focus-visible:ring-black outline-none rounded-sm">
                {formattedSegment}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
