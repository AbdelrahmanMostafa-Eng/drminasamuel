"use client";

import { RotateCcw } from "lucide-react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted-foreground">Please try again. If it keeps happening, contact the Bioacademy team.</p>
        <button onClick={reset} className="btn-3d btn-depth-brand mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-5 font-semibold text-white">
          <RotateCcw className="size-4" /> Try again
        </button>
      </div>
    </div>
  );
}
