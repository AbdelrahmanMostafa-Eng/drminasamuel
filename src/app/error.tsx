"use client";

import { RotateCcw } from "lucide-react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <h2 className="font-display text-2xl font-light tracking-tight">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted-foreground">Please try again. If it keeps happening, contact the Bioacademy team.</p>
        <button onClick={reset} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background hover:opacity-85">
          <RotateCcw className="size-4" /> Try again
        </button>
      </div>
    </div>
  );
}
