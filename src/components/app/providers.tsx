"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/components/ui/confirm";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        <ConfirmProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ classNames: { toast: "!rounded-2xl !font-sans !shadow-lift" } }}
          />
        </ConfirmProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
