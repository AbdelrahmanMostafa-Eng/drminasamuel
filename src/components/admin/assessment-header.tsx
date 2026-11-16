"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { deleteAssessmentAction, resetSubmissionAction } from "@/actions/admin-assess";
import { AssessmentDialog, type AssessmentValues } from "./assessment-dialog";
import { useAction } from "./use-action";

export function AssessmentActions({ id, courseId, initial, placeLabel, canEdit }: { id: string; courseId: string; initial: AssessmentValues; placeLabel: string; canEdit: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = React.useState(false);
  const { pending, exec } = useAction();
  if (!canEdit) return null;
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Pencil className="size-4" /> Settings
      </Button>
      <Button
        variant="ghost"
        className="hover:text-danger"
        loading={pending}
        onClick={async () => {
          if (await confirm({ title: "Delete this assessment?", description: "All questions and student submissions will be permanently deleted.", danger: true, confirmLabel: "Delete", typeToConfirm: "DELETE" }))
            exec(() => deleteAssessmentAction(id), { refresh: false, onSuccess: (cid) => router.push(`/admin/courses/${cid ?? courseId}`) });
        }}
      >
        <Trash2 className="size-4" />
      </Button>
      <AssessmentDialog open={open} onOpenChange={setOpen} courseId={courseId} id={id} initial={initial} placeLabel={placeLabel} />
    </>
  );
}

export function ResetAttemptButton({ submissionId, name }: { submissionId: string; name: string }) {
  const confirm = useConfirm();
  const { pending, exec } = useAction();
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      loading={pending}
      title="Reset attempt"
      onClick={async () => {
        if (await confirm({ title: `Reset ${name}'s attempt?`, description: "Their submission is deleted so they can take it again (only while it's still open).", danger: true, confirmLabel: "Reset" })) exec(() => resetSubmissionAction(submissionId));
      }}
    >
      {!pending && <RotateCcw className="size-3.5" />}
    </Button>
  );
}
