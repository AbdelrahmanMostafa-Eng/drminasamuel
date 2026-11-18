"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { PdfViewer, type MediaItem } from "./lesson-media";
import { cn } from "@/lib/utils";

export function PdfTabs({ items, watermark }: { items: MediaItem[]; watermark: string }) {
  const [active, setActive] = React.useState(items[0]?.id);
  const cur = items.find((i) => i.id === active) ?? items[0];
  if (!cur) return null;
  return (
    <div className="space-y-3">
      {items.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {items.map((i) => (
            <button
              key={i.id}
              onClick={() => setActive(i.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition",
                i.id === cur.id ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <FileText className="size-4" /> {i.title}
            </button>
          ))}
        </div>
      )}
      <PdfViewer key={cur.id} item={cur} watermark={watermark} />
    </div>
  );
}
