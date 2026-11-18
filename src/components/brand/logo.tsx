import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, light, href = "/", compact }: { className?: string; light?: boolean; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Bioacademy home">
      <Image src="/brand/logo-mark.png" alt="" width={30} height={28} className={cn("h-7 w-auto", light ? "invert" : "dark:invert")} priority />
      {!compact && (
        <span className="leading-none">
          <span className={cn("block font-display text-[1.2rem] font-normal tracking-tight", light ? "text-white" : "text-foreground")}>Bioacademy</span>
          <span className={cn("mt-1 block font-mono text-[0.58rem] uppercase tracking-[0.18em]", light ? "text-white/60" : "text-muted-foreground")}>Dr. Mina Samuel</span>
        </span>
      )}
    </Link>
  );
}
