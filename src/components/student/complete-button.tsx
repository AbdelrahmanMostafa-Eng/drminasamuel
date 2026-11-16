"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { CheckCircle2, Circle } from "lucide-react";
import { toggleLessonCompleteAction } from "@/actions/student";
import { Button } from "@/components/ui/button";

export function CompleteButton({ lessonId, done }: { lessonId: string; done: boolean }) {
  const router = useRouter();
  const [state, setState] = React.useState(done);
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant={state ? "success" : "secondary"}
      loading={pending}
      onClick={(e) => {
        const next = !state;
        setState(next);
        if (next) {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          confetti({ particleCount: 90, spread: 70, startVelocity: 35, origin: { x: (r.left + r.width / 2) / window.innerWidth, y: r.top / window.innerHeight }, colors: ["#ff8a1a", "#4396b6", "#ffd2a3", "#0f9d6b"] });
        }
        start(async () => {
          await toggleLessonCompleteAction(lessonId, next);
          router.refresh();
        });
      }}
    >
      {!pending && (state ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />)}
      {state ? "Completed" : "Mark as complete"}
    </Button>
  );
}
