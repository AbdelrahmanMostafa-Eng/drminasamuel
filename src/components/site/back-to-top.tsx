"use client";

import { ArrowUp } from "lucide-react";
import { RollText } from "./roll-text";

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <RollText>Back to top</RollText>
      <ArrowUp className="nudge nudge-up size-3.5" />
    </button>
  );
}
