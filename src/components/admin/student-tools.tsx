"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Pencil, Phone, Trash2, UserCheck, UserPlus, UserX, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/misc";
import { useConfirm } from "@/components/ui/confirm";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { createStudentAction, deleteStudentAction, forceLogoutAction, manualEnrollAction, resetPasswordAction, setUserActiveAction, updateStudentAction } from "@/actions/admin-people";
import { useAction } from "./use-action";

export function AddStudentButton({ courses }: { courses: { id: string; title: string; price: number }[] }) {
  const [open, setOpen] = React.useState(false);
  const [creds, setCreds] = React.useState<{ login: string; password: string } | null>(null);
  const { pending, exec } = useAction();
  return (
    <>
      <Button variant="accent" onClick={() => { setCreds(null); setOpen(true); }}>
        <UserPlus className="size-4" /> Add student
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Add a student manually" description="For students who paid at a center or need help signing up. They'll set their own password on first sign-in.">
          {creds ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="font-bold text-emerald-700 dark:text-emerald-300">Account created ✓</p>
                <p className="mt-2 text-sm">Sign-in: <b className="font-mono">{creds.login}</b></p>
                <p className="text-sm">Temporary password: <b className="font-mono">{creds.password}</b></p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton value={`Bioacademy login\nWhatsApp number: ${creds.login}\nTemporary password: ${creds.password}`} label="Login details" />
                <a href={`https://wa.me/${creds.login.replace(/\D/g, "")}?text=${encodeURIComponent(`Welcome to Bioacademy! 🎉\nSign in at ${typeof window !== "undefined" ? window.location.origin : ""}/login\nWhatsApp number: ${creds.login}\nTemporary password: ${creds.password}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-[#128c7e]">
                  <WhatsAppIcon className="size-3.5" /> Send on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
                exec(() => createStudentAction({ fullName: f.fullName ?? "", whatsapp: f.whatsapp ?? "", email: f.email, parentPhone: f.parentPhone ?? "", courseId: f.courseId || null }), { onSuccess: (d) => d && setCreds(d) });
              }}
              className="space-y-4"
            >
              <Field name="fullName" label="Full name (English)" icon={<User />} required />
              <Field name="whatsapp" label="WhatsApp number" icon={<WhatsAppIcon />} required />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field name="email" type="email" label="Email (optional)" />
                <Field name="parentPhone" type="tel" label="Parent's number" icon={<Phone />} required />
              </div>
              <Select name="courseId" label="Enroll in course (marks as paid)" defaultValue="">
                <option value="">Don't enroll yet</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Create account
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StudentActions({
  student,
  courses,
  canStudents,
  canPayments,
}: {
  student: { id: string; fullName: string; whatsapp: string | null; email: string | null; parentPhone: string | null; isActive: boolean };
  courses: { id: string; title: string }[];
  canStudents: boolean;
  canPayments: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const { pending, exec } = useAction();
  const [edit, setEdit] = React.useState(false);
  const [enroll, setEnroll] = React.useState(false);
  const [temp, setTemp] = React.useState<string | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      {canStudents && (
        <>
          <Button variant="secondary" size="sm" onClick={() => setEdit(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={pending}
            onClick={async () => {
              if (await confirm({ title: "Reset password?", description: "A temporary password is generated. The student must change it on next sign-in. Current devices are signed out." }))
                exec(() => resetPasswordAction(student.id), { onSuccess: (p) => p && setTemp(p) });
            }}
          >
            <KeyRound className="size-4" /> Reset password
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exec(() => forceLogoutAction(student.id))}>
            <LogOut className="size-4" /> Reset device
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exec(() => setUserActiveAction(student.id, !student.isActive))}>
            {student.isActive ? <UserX className="size-4" /> : <UserCheck className="size-4" />} {student.isActive ? "Suspend" : "Activate"}
          </Button>
        </>
      )}
      {canPayments && courses.length > 0 && (
        <Button variant="secondary" size="sm" onClick={() => setEnroll(true)}>
          <UserPlus className="size-4" /> Enroll manually
        </Button>
      )}
      {canStudents && (
        <Button
          variant="ghost"
          size="sm"
          className="hover:text-danger"
          onClick={async () => {
            if (await confirm({ title: `Delete ${student.fullName}'s account?`, description: "Grades, attendance and payments for this student are permanently deleted. Generated PDF reports keep their snapshot.", danger: true, confirmLabel: "Delete account", typeToConfirm: "DELETE" }))
              exec(() => deleteStudentAction(student.id), { refresh: false, onSuccess: () => router.push("/admin/students") });
          }}
        >
          <Trash2 className="size-4" /> Delete
        </Button>
      )}

      <Dialog open={!!temp} onOpenChange={(o) => !o && setTemp(null)}>
        <DialogContent title="Temporary password" description="Share it privately with the student.">
          <p className="rounded-2xl bg-muted p-4 text-center font-mono text-2xl font-bold tracking-wider">{temp}</p>
          <div className="mt-4 flex gap-2">
            <CopyButton value={temp ?? ""} label="Password" />
            {student.whatsapp && (
              <a href={`https://wa.me/${student.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Your Bioacademy password was reset.\nTemporary password: ${temp}\nYou'll choose a new one when you sign in.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-[#128c7e]">
                <WhatsAppIcon className="size-3.5" /> Send on WhatsApp
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent title="Edit student">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
              exec(() => updateStudentAction(student.id, { fullName: f.fullName ?? "", whatsapp: f.whatsapp ?? "", email: f.email, parentPhone: f.parentPhone }), { onSuccess: () => setEdit(false) });
            }}
            className="space-y-4"
          >
            <Field name="fullName" label="Full name" defaultValue={student.fullName} required />
            <Field name="whatsapp" label="WhatsApp" defaultValue={student.whatsapp ?? ""} required />
            <Field name="email" label="Email" defaultValue={student.email ?? ""} />
            <Field name="parentPhone" type="tel" label="Parent's number" defaultValue={student.parentPhone ?? ""} required />
            <div className="flex justify-end">
              <Button type="submit" loading={pending}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={enroll} onOpenChange={setEnroll}>
        <DialogContent title="Enroll manually" description="Use this when the student paid in cash or at a center. It's recorded as approved.">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
              exec(() => manualEnrollAction(student.id, f.courseId ?? "", f.amount ? Number(f.amount) : undefined), { onSuccess: () => setEnroll(false) });
            }}
            className="space-y-4"
          >
            <Select name="courseId" label="Course" required>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
            <Field name="amount" type="number" label="Amount paid (EGP, optional)" hint="Defaults to the course price" />
            <div className="flex justify-end">
              <Button type="submit" loading={pending}>
                Enroll student
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
