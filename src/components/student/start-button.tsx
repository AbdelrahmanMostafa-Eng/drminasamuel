"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
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
      variant="accent"
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

export function Celebrate() {
  React.useEffect(() => {
    const end = Date.now() + 1200;
    const colors = ["#ff8a1a", "#4396b6", "#ffd2a3", "#0f9d6b"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);
  return null;
}
