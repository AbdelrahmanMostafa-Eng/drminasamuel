import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The portfolio template's slowly rotating orb behind Dr. Mina: a scarlet macaw photo, built so
 * the whole bird (beak to tail tip) sits inside the circle.
 */
export function HeroOrb({ className, rotate = true }: { className?: string; rotate?: boolean }) {
  return (
    <div className={cn("pointer-events-none select-none", className)} aria-hidden>
      <div className="relative aspect-square w-full">
        <div className={cn("absolute inset-0", rotate && "animate-orb-rotate")}>
          <Image src="/images/parrot-disc.webp" alt="" fill sizes="(min-width: 1024px) 640px, 90vw" className="object-contain" priority />
        </div>
      </div>
    </div>
  );
}
