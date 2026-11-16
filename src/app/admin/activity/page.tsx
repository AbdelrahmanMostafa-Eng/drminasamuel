import { History } from "lucide-react";
import { db } from "@/lib/db";
import { requireMaster } from "@/lib/auth";
import { fmt } from "@/lib/time";
import { PageHeader, EmptyState } from "@/components/ui/misc";

export default async function ActivityPage() {
  await requireMaster();
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 400 });
  return (
    <>
      <PageHeader eyebrow="Administration" title="Activity log" description="Who changed what, and when — uploads, approvals, grade changes, accounts and settings." />
      {logs.length === 0 ? (
        <EmptyState icon={<History />} title="No activity yet" />
      ) : (
        <div className="relative space-y-3 before:absolute before:bottom-2 before:left-[1.15rem] before:top-2 before:w-px before:bg-border">
          {logs.map((l) => (
            <div key={l.id} className="relative flex gap-4 pl-1">
              <span className="relative z-10 mt-3 grid size-8 shrink-0 place-items-center rounded-full border-4 border-background bg-brand-500" />
              <div className="flex-1 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
                <p className="text-sm">
                  <b>{l.actorName}</b> <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">{l.action}</span>
                  {l.details && <span className="text-muted-foreground"> — {l.details}</span>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{fmt(l.createdAt, "EEE d MMM yyyy, h:mm:ss a")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
