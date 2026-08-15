"use client";

import Image from "next/image";
import { useState } from "react";

export type ImageVariant = "profile" | "book-cover" | "blog-thumbnail" | "hero" | "auto";

interface OptimizedImageProps {
  src: string;
  alt: string;
  variant?: ImageVariant;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

const variantSizes: Record<ImageVariant, string> = {
  profile: "(max-width: 768px) 48px, 64px",
  "book-cover": "(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw",
  "blog-thumbnail": "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  hero: "100vw",
  auto: "(max-width: 768px) 100vw, 50vw",
};

export function OptimizedImage({
  src,
  alt,
  variant = "auto",
  className,
  imageClassName,
  priority = false,
  unoptimized = false,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fallback image if original fails to load
  const fallbackSrc = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

  return (
    <div className={`relative overflow-hidden bg-zinc-900/50 ${className || ""}`}>
      <Image
        src={error ? fallbackSrc : src || fallbackSrc}
        alt={alt || "Image"}
        fill
        sizes={variantSizes[variant]}
        priority={priority}
        unoptimized={unoptimized || !!(src && src.includes('supabase.co'))}
        className={`object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"} ${imageClassName || ""}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}
