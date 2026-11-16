"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, Flag, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { archiveCourseAction, deleteCourseAction, setCourseStatusAction } from "@/actions/admin-courses";
import { useAction } from "./use-action";

export function DangerZone({
  course,
  isMaster,
  preview,
}: {
  course: { id: string; title: string; status: string };
  isMaster: boolean;
  preview: { students: number; toDelete: number; toKeep: number };
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const { pending, exec } = useAction();
  return (
    <div className="space-y-4">
      {course.status !== "ENDED" && course.status !== "ARCHIVED" && (
        <Row
          icon={<Flag className="size-5" />}
          title="Mark course as ended"
          text="Closes enrollment and marks the course finished. Students can still open content until you archive it."
          action={
            <Button
              variant="secondary"
              loading={pending}
              onClick={async () => {
                if (await confirm({ title: "End this course?", description: "Enrollment closes. Nothing is deleted yet.", confirmLabel: "Mark as ended" })) exec(() => setCourseStatusAction(course.id, "ENDED"));
              }}
            >
              Mark as ended
            </Button>
          }
        />
      )}
      {course.status === "ENDED" && (
        <>
          <Row
            icon={<RotateCcw className="size-5" />}
            title="Re-open course"
            text="Made a mistake? Put the course back to Published."
            action={<Button variant="secondary" loading={pending} onClick={() => exec(() => setCourseStatusAction(course.id, "PUBLISHED"))}>Re-open</Button>}
          />
          {isMaster && (
            <Row
              danger
              icon={<Archive className="size-5" />}
              title="Archive course & delete student accounts"
              text={`Generates final attendance, grades and summary PDFs (kept forever in Reports), then deletes ${preview.toDelete} student account${preview.toDelete === 1 ? "" : "s"}. ${preview.toKeep} student${preview.toKeep === 1 ? " is" : "s are"} also enrolled in another active course and will keep their account.`}
              action={
                <Button
                  variant="danger"
                  loading={pending}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Archive and delete accounts?",
                      description: `This can't be undone. ${preview.toDelete} student accounts will be permanently deleted after the final PDF reports are saved.`,
                      danger: true,
                      confirmLabel: "Archive & delete",
                      typeToConfirm: "ARCHIVE",
                    });
                    if (ok)
                      exec(() => archiveCourseAction(course.id), {
                        silent: true,
                        onSuccess: (r) => {
                          toast.success(`Archived. ${r?.deleted ?? 0} accounts deleted, ${r?.kept ?? 0} kept. Final reports are in PDF reports.`);
                          router.push("/admin/reports");
                        },
                      });
                  }}
                >
                  Archive & delete
                </Button>
              }
            />
          )}
        </>
      )}
      {isMaster && (
        <Row
          danger
          icon={<Trash2 className="size-5" />}
          title="Delete course"
          text="Permanently deletes the course with all chapters, files, grades, attendance and enrollments. Use Archive instead for finished courses."
          action={
            <Button
              variant="ghost"
              className="text-danger"
              loading={pending}
              onClick={async () => {
                if (await confirm({ title: "Delete course permanently?", description: "Everything inside it will be lost.", danger: true, confirmLabel: "Delete forever", typeToConfirm: course.title }))
                  exec(() => deleteCourseAction(course.id), { refresh: false, onSuccess: () => router.push("/admin/courses") });
              }}
            >
              Delete course
            </Button>
          }
        />
      )}
    </div>
  );
}

function Row({ icon, title, text, action, danger }: { icon: React.ReactNode; title: string; text: string; action: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${danger ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20" : "border-border"}`}>
      <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${danger ? "bg-red-100 text-danger dark:bg-red-900/40" : "bg-muted text-muted-foreground"}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
