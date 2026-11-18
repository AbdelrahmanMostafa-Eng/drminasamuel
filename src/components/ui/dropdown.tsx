"use client";

import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Dropdown = M.Root;
export const DropdownTrigger = M.Trigger;

export function DropdownContent({ children, className, align = "end" }: { children: React.ReactNode; className?: string; align?: "start" | "end" | "center" }) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={8}
        className={cn(
          "z-50 min-w-48 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lift data-[state=open]:animate-[pop-in_140ms_ease-out]",
          className,
        )}
      >
        {children}
      </M.Content>
    </M.Portal>
  );
}

export function DropdownItem({ children, onSelect, danger, className, disabled }: { children: React.ReactNode; onSelect?: (e: Event) => void; danger?: boolean; className?: string; disabled?: boolean }) {
  return (
    <M.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-muted data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:text-muted-foreground",
        danger && "text-danger data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-950/40 [&>svg]:text-danger",
        className,
      )}
    >
      {children}
    </M.Item>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <M.Label className="eyebrow px-3 pb-1 pt-2">{children}</M.Label>;
}

export function DropdownSeparator() {
  return <M.Separator className="my-1 h-px bg-border" />;
}
