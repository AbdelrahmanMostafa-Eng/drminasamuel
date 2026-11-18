"use client";

import * as React from "react";
import { FileDown, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateReportAction } from "@/actions/admin-assess";

/**
 * Generates a frozen PDF snapshot and downloads it.
 * Only enabled once the session has ended / the deadline has passed.
 */
export function ReportButton({
  type,
  refId,
  availableAt,
  label = "Generate PDF report",
  size = "md",
  variant = "primary",
}: {
  type: "ATTENDANCE" | "GRADES" | "COURSE_SUMMARY";
  refId: string;
  availableAt?: string | null;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "accent" | "primary" | "secondary";
}) {
  const [pending, start] = React.useTransition();
  const [now, setNow] = React.useState(() => Date.now());
  const at = availableAt ? new Date(availableAt).getTime() : 0;
  React.useEffect(() => {
    if (!at || at <= Date.now()) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [at]);
  const locked = at > now;
  if (locked) {
    return (
      <Button variant="secondary" size={size} disabled title="Appears when the session ends / the deadline passes">
        <Lock className="size-4" /> PDF after {type === "ATTENDANCE" ? "session ends" : "deadline"}
      </Button>
    );
  }
  return (
    <Button
      variant={variant}
      size={size}
      loading={pending}
      onClick={() => {
        start(async () => {
          const res = await generateReportAction(type, refId);
          if (!res.ok || !res.data) return void toast.error(res.ok ? "Failed" : res.error);
          toast.success("Report generated — downloading PDF");
          const a = document.createElement("a");
          a.href = `/api/reports/${res.data}/pdf`;
          a.click();
        });
      }}
    >
      {!pending && <FileDown className="size-4" />} {label}
    </Button>
  );
}
