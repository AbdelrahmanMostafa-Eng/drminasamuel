"use client";

import { Eye, FileDown, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm";
import { deleteReportAction } from "@/actions/admin-assess";
import { useAction } from "./use-action";

export function ReportRowActions({ id, canDelete }: { id: string; canDelete: boolean }) {
  const confirm = useConfirm();
  const { exec } = useAction();
  return (
    <div className="flex justify-end gap-1">
      <a href={`/api/reports/${id}/pdf?inline=1`} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-xl border border-border hover:bg-muted" title="View">
        <Eye className="size-4" />
      </a>
      <a href={`/api/reports/${id}/pdf`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background hover:opacity-85" title="Download">
        <FileDown className="size-4" /> PDF
      </a>
      {canDelete && (
        <button
          onClick={async () => {
            if (await confirm({ title: "Delete this report?", description: "The archived snapshot is removed permanently.", danger: true, confirmLabel: "Delete" })) exec(() => deleteReportAction(id));
          }}
          className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:text-danger"
          title="Delete"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
