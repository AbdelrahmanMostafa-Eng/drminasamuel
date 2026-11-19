import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock, ExternalLink, KeyRound, Radio, UserX, Users, Video } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff, requireStaffAny } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { sessionEnd, sessionPhase } from "@/lib/access";
import { fmt, toLocalInput, relative } from "@/lib/time";
import { formatPhone, waLink } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyButton, StatCard } from "@/components/ui/misc";
import { ReportButton } from "@/components/admin/report-button";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { EditSessionButton } from "@/components/admin/session-dialog";
import { AttendanceMenu, DeleteSessionButton, EndSessionButton } from "@/components/admin/session-controls";
import { WhatsAppIcon } from "@/components/brand/social-icons";

export default async function AdminSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaffAny(["sessions", "attendance", "reports"]);
  const s = await db.liveSession.findUnique({ where: { id }, include: { course: true, attendance: true } });
  if (!s) notFound();
  const phase = sessionPhase(s);
  const end = sessionEnd(s);
  const enrollments = await db.enrollment.findMany({ where: { courseId: s.courseId, status: "APPROVED" }, include: { user: true }, orderBy: { user: { fullName: "asc" } } });
  const byUser = new Map(s.attendance.map((a) => [a.userId, a]));
  const rows = enrollments.map((e) => {
    const a = byUser.get(e.userId);
    const present = a?.override ? a.override === "PRESENT" : !!a?.joinedAt;
    const later = e.submittedAt > end && !a;
    return { e, a, present, later };
  });
  const counted = rows.filter((r) => !r.later);
  const present = counted.filter((r) => r.present).length;
  const excused = counted.filter((r) => !r.present && r.a?.excuse).length;
  const unexcused = counted.length - present - excused;
  const canAtt = can(user, "attendance");
  const canSessions = can(user, "sessions");

  return (
    <>
      <AutoRefresh seconds={10} enabled={phase !== "ended" && phase !== "upcoming"} />
      <Link href="/admin/schedule" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Sessions
      </Link>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            {phase === "live" ? (
              <Badge tone="danger" className="animate-pulse"><Radio className="size-3" /> Live now — auto-refreshing</Badge>
            ) : phase === "open" ? (
              <Badge tone="success" dot>Join is open</Badge>
            ) : phase === "ended" ? (
              <Badge tone="neutral">Ended {relative(end)}</Badge>
            ) : (
              <Badge tone="brand">Starts {relative(s.startsAt)}</Badge>
            )}
            <Badge tone="neutral">{s.course.title}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-display font-light tracking-tight sm:text-3xl">{s.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="size-4" /> {fmt(s.startsAt, "EEEE d MMMM · h:mm a")} – {fmt(end, "h:mm a")}
            {s.endedAt && s.endedAt < s.endsAt && " (ended early)"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSessions && phase !== "ended" && <EndSessionButton id={s.id} />}
          {canSessions && (
            <EditSessionButton
              id={s.id}
              courses={[{ id: s.courseId, title: s.course.title }]}
              initial={{
                courseId: s.courseId,
                title: s.title,
                description: s.description,
                startsAt: toLocalInput(s.startsAt),
                endsAt: toLocalInput(s.endsAt),
                zoomUrl: s.zoomUrl,
                meetingId: s.meetingId ?? "",
                passcode: s.passcode ?? "",
                joinOpensMinutes: s.joinOpensMinutes,
                recordingUrl: s.recordingUrl ?? "",
              }}
            />
          )}
          {can(user, "reports") && <ReportButton type="ATTENDANCE" refId={s.id} availableAt={end.toISOString()} />}
          {canSessions && <DeleteSessionButton id={s.id} />}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Enrolled students" value={counted.length} icon={<Users />} />
        <StatCard label="Present" value={present} icon={<CheckCircle2 />} tone="success" hint={counted.length ? `${Math.round((present / counted.length) * 100)}% attendance` : undefined} />
        <StatCard label="Absent · Excuse Given" value={excused} icon={<Clock />} tone="ember" />
        <StatCard label={phase === "ended" ? "Absent · Excuse NOT Given" : "Not joined yet"} value={unexcused} icon={<UserX />} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Attendance" description="Present = clicked Join session on Bioacademy. Use ⋯ to adjust manually." icon={<Users />} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Excuse</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ e, a, present, later }) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <Link prefetch={false} href={`/admin/students/${e.userId}`} className="font-semibold hover:text-primary">{e.user.fullName}</Link>
                      <p className="text-xs text-muted-foreground">{formatPhone(e.user.whatsapp)}</p>
                    </td>
                    <td className="px-5 py-3">
                      {later ? (
                        <Badge tone="neutral">Enrolled later</Badge>
                      ) : present ? (
                        <Badge tone="success">Present{a?.override ? "*" : ""}</Badge>
                      ) : phase === "ended" || a?.override === "ABSENT" ? (
                        <Badge tone="danger">Absent{a?.override ? "*" : ""}</Badge>
                      ) : (
                        <Badge tone="neutral">Not joined yet</Badge>
                      )}
                    </td>
                    <td className="max-w-xs px-5 py-3">
                      {!present && !later && (a?.excuse ? (
                        <div>
                          <Badge tone="warning">Excuse Given</Badge>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={a.excuse}>“{a.excuse}”</p>
                        </div>
                      ) : phase === "ended" ? (
                        <Badge tone="danger">Excuse NOT Given</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      ))}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{a?.joinedAt ? fmt(a.joinedAt, "h:mm a") : "—"}{a && a.joinCount > 1 ? ` (${a.joinCount}×)` : ""}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {!present && e.user.whatsapp && phase !== "upcoming" && (
                          <a href={waLink(e.user.whatsapp, phase === "ended" ? `Hi ${e.user.fullName.split(" ")[0]}, you missed today's session “${s.title}”. Please let us know why.` : `Hi ${e.user.fullName.split(" ")[0]}, the session “${s.title}” is live now — join from your Bioacademy dashboard!`)} target="_blank" rel="noopener noreferrer" className="grid size-8 place-items-center rounded-lg text-[#128c7e] hover:bg-muted" title="Message on WhatsApp">
                            <WhatsAppIcon className="size-4" />
                          </a>
                        )}
                        {canAtt && !later && <AttendanceMenu sessionId={s.id} userId={e.userId} override={a?.override ?? null} />}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No approved students in this course yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Zoom details" icon={<Video />} />
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 p-3">
                <span className="truncate font-mono text-xs">{s.zoomUrl}</span>
                <CopyButton value={s.zoomUrl} label="Zoom link" />
              </div>
              {s.meetingId && <p>Meeting ID: <b className="font-mono">{s.meetingId}</b></p>}
              {s.passcode && <p className="flex items-center gap-1.5"><KeyRound className="size-4 text-muted-foreground" /> Passcode: <b className="font-mono">{s.passcode}</b></p>}
              <a href={s.zoomUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background hover:opacity-85">
                Start / open Zoom <ExternalLink className="size-4" />
              </a>
              <p className="text-xs text-muted-foreground">Students never see this link directly — they use the Join button, which records attendance first. Join opens {s.joinOpensMinutes} min before start.</p>
            </CardBody>
          </Card>
          {s.description && (
            <Card>
              <CardHeader title="Session notes" />
              <CardBody className="whitespace-pre-line text-sm text-muted-foreground">{s.description}</CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
