import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { Helix } from "@/components/ui/loader";
import { ThemeToggle } from "@/components/app/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-brand-950 p-10 text-white lg:flex lg:flex-col">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="absolute -left-32 top-20 size-[30rem] rounded-full bg-brand-500/25 blur-[110px]" />
        <div className="absolute -right-10 bottom-10 size-[24rem] rounded-full bg-ember-500/20 blur-[110px]" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative my-auto">
          <div className="relative mx-auto max-w-md">
            <div className="absolute -left-6 top-6 opacity-70">
              <Helix count={9} />
            </div>
            <Image src="/brand/dr-mina.webp" alt="Dr. Mina Samuel" width={816} height={698} priority className="relative mx-auto h-auto w-[88%] drop-shadow-[0_30px_50px_rgb(0_0_0/0.6)] [mask-image:linear-gradient(to_bottom,black_80%,transparent)]" />
          </div>
          <blockquote className="mx-auto mt-6 max-w-md text-center">
            <p className="font-display text-2xl font-medium leading-snug">
              “Understand it once, <em className="text-ember-400">remember it forever.</em>”
            </p>
            <footer className="mt-3 text-sm text-brand-100/70">Dr. Mina Samuel · ACT2 & EST Biology</footer>
          </blockquote>
        </div>
        <p className="relative text-xs text-brand-100/50">© {new Date().getFullYear()} Bioacademy</p>
      </aside>
      <main className="relative flex flex-col">
        <div className="flex items-center justify-between p-5 lg:justify-end">
          <div className="lg:hidden">
            <Logo />
          </div>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
