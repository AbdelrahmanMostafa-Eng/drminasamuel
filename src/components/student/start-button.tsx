"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { startAttemptAction } from "@/actions/student";

export function StartButton({ assessmentId, label, resume, timed }: { assessmentId: string; label: string; resume?: boolean; timed: number | null }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, start] = React.useTransition();
  return (
    <Button
      size="lg"
      variant="primary"
      loading={pending}
      onClick={async () => {
        if (!resume && timed) {
          const ok = await confirm({ title: "Start the timer?", description: `You'll have ${timed} minutes once you start. The timer keeps running even if you close the page.`, confirmLabel: "Start now" });
          if (!ok) return;
        }
        start(async () => {
          const r = await startAttemptAction(assessmentId);
          if (!r.ok) return void toast.error(r.error);
          router.refresh();
        });
      }}
    >
      {!pending && <Play className="size-4" />} {label}
    </Button>
  );
}

/** Previously fired confetti; kept as a no-op so callers don't change. */
export function Celebrate() {
  return null;
}
