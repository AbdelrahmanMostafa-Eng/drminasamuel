"use client";

import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
  size = "md",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-brand-950/55 backdrop-blur-sm data-[state=open]:animate-[fade-in_200ms_ease] data-[state=closed]:animate-[fade-out_150ms_ease]" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl data-[state=open]:animate-[dialog-in_260ms_cubic-bezier(0.2,0.9,0.3,1.2)] data-[state=closed]:animate-[dialog-out_150ms_ease]",
          w,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <D.Title className="text-lg font-bold tracking-tight">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-sm text-muted-foreground">{description}</D.Description> : <D.Description className="sr-only">{String(title)}</D.Description>}
          </div>
          <D.Close className="rounded-xl p-2 text-muted-foreground transition hover:rotate-90 hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </div>
        <div className="overflow-y-auto scrollbar-thin px-6 py-5">{children}</div>
      </D.Content>
    </D.Portal>
  );
}
