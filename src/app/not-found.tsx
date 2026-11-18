import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Error 404</p>
        <h1 className="mt-6 font-display text-5xl font-light tracking-tight md:text-7xl">Page not found.</h1>
        <p className="mx-auto mt-5 max-w-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t have access to it.</p>
        <Link href="/" className="mt-10 inline-flex items-center justify-center rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-85">
          Back to home
        </Link>
      </div>
    </main>
  );
}
