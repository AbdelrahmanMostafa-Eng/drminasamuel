"use client";

import { X } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm";
import { removeEnrollmentAction } from "@/actions/admin-people";
import { useAction } from "./use-action";

export function RemoveEnrollmentButton({ id, course }: { id: string; course: string }) {
  const confirm = useConfirm();
  const { exec } = useAction();
  return (
    <button
      onClick={async () => {
        if (await confirm({ title: "Remove from course?", description: `The student loses access to “${course}”. Their payment record is deleted.`, danger: true, confirmLabel: "Remove" })) exec(() => removeEnrollmentAction(id));
      }}
      className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-danger dark:hover:bg-red-950/40"
      title="Remove from course"
    >
      <X className="size-4" />
    </button>
  );
}
