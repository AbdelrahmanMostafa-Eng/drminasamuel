"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/components/ui/confirm";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The public website is always light (warm off-white); dark mode is offered inside the dashboards.
  const inApp = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/account");
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange forcedTheme={inApp ? undefined : "light"}>
      <TooltipProvider delayDuration={200}>
        <ConfirmProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ classNames: { toast: "!rounded-xl !border-border !font-sans !shadow-lift" } }} />
        </ConfirmProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
