import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/site/header";
import { HeroOrb } from "@/components/site/orb";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden flex-col overflow-hidden border-r border-border bg-[#ecebe5] p-10 lg:flex">
        <Link href="/" aria-label="Bioacademy home" className="relative z-10">
          <Wordmark />
        </Link>
        <div className="relative my-auto">
          <HeroOrb className="absolute -right-[2%] top-0 w-[80%]" />
          <Image
            src="/images/dr-mina-clean.webp"
            alt="Dr. Mina Samuel"
            width={393}
            height={696}
            priority
            className="relative z-10 mx-auto h-auto w-[52%] [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
          />
        </div>
        <div className="relative z-10 flex items-end justify-between gap-6">
          <p className="max-w-xs font-display text-2xl font-light leading-snug tracking-tight">ACT2 &amp; EST Biology with Dr. Mina Samuel.</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">© {new Date().getFullYear()} Bioacademy</p>
        </div>
      </aside>
      <main className="relative flex flex-col">
        <div className="flex items-center justify-between p-6 lg:justify-end">
          <Link href="/" className="lg:hidden" aria-label="Bioacademy home">
            <Wordmark />
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to website
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
