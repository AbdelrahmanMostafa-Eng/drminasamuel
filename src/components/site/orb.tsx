import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The portfolio template's slowly rotating orb — here it's a real fluorescence
 * micrograph (bovine endothelial cells, public domain), seen as if through an eyepiece.
 */
export function MicroscopeOrb({ className, caption = true }: { className?: string; caption?: boolean }) {
  return (
    <div className={cn("pointer-events-none select-none", className)} aria-hidden>
      <div className="relative aspect-square w-full">
        <div className="absolute inset-0 animate-orb-rotate">
          <Image src="/images/micrograph-disc.webp" alt="" fill sizes="(min-width: 1024px) 560px, 80vw" className="object-contain" priority />
        </div>
        <div className="absolute inset-[3%] rounded-full ring-1 ring-black/5" />
      </div>
      {caption && (
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Endothelial cells · fluorescence micrograph
        </p>
      )}
    </div>
  );
}
