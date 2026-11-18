import Link from "next/link";
import { ChevronRight, Radio, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/lib/time";
import { sessionEnd, sessionPhase } from "@/lib/access";

export type AdminSessionRow = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  endedAt: Date | null;
  joinOpensMinutes: number;
  course: { title: string };
  present: number;
  excused: number;
  hasReport: boolean;
};

export function AdminSessionList({ sessions, empty = "No sessions." }: { sessions: AdminSessionRow[]; empty?: string }) {
  if (!sessions.length) return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-2.5">
      {sessions.map((s) => {
        const phase = sessionPhase(s);
        return (
          <Link key={s.id} href={`/admin/sessions/${s.id}`} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-foreground/20">
            <div className={`grid w-14 shrink-0 place-items-center rounded-lg border border-border py-1.5 ${phase === "ended" ? "text-muted-foreground" : "text-foreground"}`}>
              <span className="text-[0.6rem] font-bold uppercase">{fmt(s.startsAt, "MMM")}</span>
              <span className="text-lg font-semibold leading-none">{fmt(s.startsAt, "d")}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold group-hover:text-primary">{s.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {s.course.title} · {fmt(s.startsAt, "EEE h:mm a")} – {fmt(sessionEnd(s), "h:mm a")}
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {phase === "live" ? (
                <Badge tone="danger" className="animate-pulse">
                  <Radio className="size-3" /> Live · {s.present} present
                </Badge>
              ) : phase === "ended" ? (
                <>
                  <Badge tone="success">{s.present} present</Badge>
                  {s.excused > 0 && <Badge tone="warning">{s.excused} excused</Badge>}
                  {!s.hasReport && <Badge tone="ember">PDF ready</Badge>}
                </>
              ) : (
                <Badge tone="brand">
                  <Video className="size-3" /> Scheduled
                </Badge>
              )}
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  );
}
