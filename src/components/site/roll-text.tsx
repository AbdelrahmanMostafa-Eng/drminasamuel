import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Premium hover for links and buttons: on hover each letter rolls up and an identical copy rolls in
 * from below, one letter after another. Screen readers get the plain text once.
 */
export function RollText({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cn("relative", className)}>
      <span className="sr-only">{children}</span>
      <span className="roll" aria-hidden>
        {Array.from(children).map((ch, i) => (
          <span key={i} className="roll-ch" data-ch={ch} style={{ "--i": i } as CSSProperties}>
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}
