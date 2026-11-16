"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/** Re-fetches server data every few seconds (used for live attendance). */
export function AutoRefresh({ seconds = 10, enabled = true }: { seconds?: number; enabled?: boolean }) {
  const router = useRouter();
  React.useEffect(() => {
    if (!enabled) return;
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(iv);
  }, [router, seconds, enabled]);
  return null;
}
