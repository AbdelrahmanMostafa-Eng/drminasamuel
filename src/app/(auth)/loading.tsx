/** Shown instantly while the sign-in / register page renders (these pages check the session). */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-2/3 rounded-lg bg-foreground/[0.06]" />
      <div className="mt-3 h-4 w-1/2 rounded bg-foreground/[0.05]" />
      <div className="mt-10 h-12 rounded-xl bg-foreground/[0.05]" />
      <div className="mt-4 h-12 rounded-xl bg-foreground/[0.05]" />
      <div className="mt-8 h-12 rounded-full bg-foreground/[0.08]" />
    </div>
  );
}
