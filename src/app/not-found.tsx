import Link from "next/link";
import { Helix } from "@/components/ui/loader";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-brand-950 px-6 text-center text-white">
      <div>
        <div className="mx-auto mb-6 w-fit">
          <Helix count={12} />
        </div>
        <p className="font-display text-7xl font-semibold text-ember-400">404</p>
        <h1 className="mt-3 text-2xl font-bold">This page mutated out of existence.</h1>
        <p className="mt-2 text-brand-200/80">The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Link href="/" className="btn-3d btn-depth-ember mt-8 inline-flex h-12 items-center rounded-2xl bg-gradient-to-b from-ember-400 to-ember-500 px-7 font-semibold text-white">
          Back to home
        </Link>
      </div>
    </main>
  );
}
