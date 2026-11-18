"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn("relative grid size-9 place-items-center overflow-hidden rounded-lg border border-border bg-card text-foreground/70 transition-colors hover:text-foreground", className)}
      aria-label="Toggle dark mode"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? "moon" : "sun"} initial={{ y: -18, rotate: -90, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: 18, rotate: 90, opacity: 0 }} transition={{ duration: 0.25 }}>
          {dark ? <Moon className="size-[1.1rem]" /> : <Sun className="size-[1.1rem]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
