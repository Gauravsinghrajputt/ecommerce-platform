"use client";
import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import clsx from "clsx";

// `image_url` is the single source. Swap SVGs for real photos by changing that value; a bad URL degrades gracefully.
export default function ProductImage({
  src, alt, sizes, priority = false, className,
}: { src: string | null; alt: string; sizes: string; priority?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={clsx("relative aspect-square overflow-hidden bg-sand", className)}>
      {src && !failed ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized onError={() => setFailed(true)} className="object-cover" />
      ) : (
        <div role="img" aria-label={alt} className="flex h-full w-full items-center justify-center text-ink-muted"><ImageOff aria-hidden className="h-8 w-8" /></div>
      )}
    </div>
  );
}
