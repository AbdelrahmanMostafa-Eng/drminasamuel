"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { toggleLessonCompleteAction } from "@/actions/student";
import { Button } from "@/components/ui/button";

export function CompleteButton({ lessonId, done }: { lessonId: string; done: boolean }) {
  const router = useRouter();
  const [state, setState] = React.useState(done);
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant={state ? "primary" : "secondary"}
      loading={pending}
      onClick={() => {
        const next = !state;
        setState(next);
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
