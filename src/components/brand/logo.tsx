import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, light, href = "/", compact }: { className?: string; light?: boolean; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Bioacademy home">
      <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_3px_0_0_#123b4d,0_10px_20px_-10px_rgb(31_96_124/0.8)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <Image src="/brand/logo-mark-white.png" alt="" width={28} height={26} className="h-6 w-auto" priority />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={cn("block font-display text-[1.32rem] font-semibold tracking-tight", light ? "text-white" : "text-foreground")}>
            Bio<span className="text-ember-500">academy</span>
          </span>
          <span className={cn("mt-0.5 block text-[0.62rem] font-semibold uppercase tracking-[0.22em]", light ? "text-brand-200/80" : "text-muted-foreground")}>Dr. Mina Samuel</span>
        </span>
      )}
    </Link>
  );
}
