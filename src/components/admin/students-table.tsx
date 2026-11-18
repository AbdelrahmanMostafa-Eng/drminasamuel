"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Download, Search, Users } from "lucide-react";
import { Avatar, CopyButton, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { formatPhone, waLink } from "@/lib/utils";

export type StudentRow = {
  id: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
  avatar: string | null;
  isActive: boolean;
  isSample: boolean;
  lastLogin: string | null;
  createdAt: string;
  enrollments: { courseId: string; course: string; status: "PENDING" | "APPROVED" | "REJECTED" }[];
};

const df = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", day: "numeric", month: "short" });

export function StudentsTable({ rows, courses, fixedCourseId }: { rows: StudentRow[]; courses: { id: string; title: string }[]; fixedCourseId?: string }) {
  const [q, setQ] = React.useState("");
  const [course, setCourse] = React.useState(fixedCourseId ?? "");
  const [status, setStatus] = React.useState("");
  const list = rows.filter((r) => {
    if (q && !`${r.name} ${r.whatsapp} ${r.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (course && !r.enrollments.some((e) => e.courseId === course)) return false;
    if (status === "none" && r.enrollments.length) return false;
    if (status && status !== "none" && !r.enrollments.some((e) => e.status === status && (!course || e.courseId === course))) return false;
    return true;
  });
  const numbers = list.map((r) => r.whatsapp).filter(Boolean).join("\n");
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, WhatsApp or email…" className="field-input h-12 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none" />
        </div>
        {!fixedCourseId && (
          <Select label="Course" value={course} onChange={(e) => setCourse(e.target.value)} containerClassName="lg:w-64">
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        )}
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} containerClassName="lg:w-48">
          <option value="">Any</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING">Pending payment</option>
          <option value="REJECTED">Rejected</option>
          {!fixedCourseId && <option value="none">Not enrolled</option>}
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge tone="neutral">{list.length} students</Badge>
        {numbers && <CopyButton value={numbers} label={`${list.filter((r) => r.whatsapp).length} WhatsApp numbers`} />}
        <a href={`/api/export/students${course ? `?courseId=${course}` : ""}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <Download className="size-3.5" /> Export CSV
        </a>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<Users />} title="No students match" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">WhatsApp</th>
                  <th className="px-5 py-3">Courses</th>
                  <th className="px-5 py-3">Last sign-in</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <Link href={`/admin/students/${r.id}`} className="flex items-center gap-3">
                        <Avatar name={r.name} src={r.avatar} size={36} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-semibold hover:text-primary">
                            {r.name} {!r.isActive && <Badge tone="danger">Suspended</Badge>} {r.isSample && <Badge tone="ember">Example</Badge>}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">{r.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      {r.whatsapp ? (
                        <a href={waLink(r.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-[#128c7e] hover:underline dark:text-[#25d366]">
                          <WhatsAppIcon className="size-4" /> {formatPhone(r.whatsapp)}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.enrollments.length === 0 && <span className="text-xs text-muted-foreground">Not enrolled</span>}
                        {r.enrollments.map((e) => (
                          <Badge key={e.courseId} tone={e.status === "APPROVED" ? "success" : e.status === "PENDING" ? "warning" : "danger"} title={e.course}>
                            {e.course.length > 22 ? e.course.slice(0, 22) + "…" : e.course}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{r.lastLogin ? df.format(new Date(r.lastLogin)) : "Never"}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/students/${r.id}`} className="inline-grid size-8 place-items-center rounded-lg hover:bg-muted">
                        <ChevronRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
