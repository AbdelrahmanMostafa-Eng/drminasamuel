"use client";

import * as React from "react";
import { AtSign, KeyRound, LogOut, MoreHorizontal, Pencil, ShieldCheck, Trash2, User, UserCheck, UserPlus, UserX, Wand2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, CopyButton, EmptyState } from "@/components/ui/misc";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Label } from "@/components/ui/input";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { createAssistantAction, deleteAssistantAction, forceLogoutAction, setAssistantPasswordAction, setUserActiveAction, updateAssistantAction } from "@/actions/admin-people";
import { PERMISSIONS, PERMISSION_PRESETS, type Permission } from "@/lib/permissions";
import { useAction } from "./use-action";
import { formatPhone } from "@/lib/utils";

export type AssistantRow = { id: string; fullName: string; username: string; whatsapp: string | null; permissions: string[]; isActive: boolean; lastLogin: string | null; device: string | null; avatar: string | null };

const KEYS = Object.keys(PERMISSIONS) as Permission[];
const genPw = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"[b % 55]).join("");

function PermissionPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {PERMISSION_PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => onChange(p.permissions)} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold transition hover:border-brand-300">
            <Wand2 className="size-3.5 text-ember-500" /> {p.name}
          </button>
        ))}
        <button type="button" onClick={() => onChange([])} className="rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          Clear
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {KEYS.map((k) => (
          <div key={k} className={`rounded-2xl border p-3 transition ${value.includes(k) ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-900/20" : "border-border"}`}>
            <Checkbox checked={value.includes(k)} onChange={(c) => onChange(c ? [...value, k] : value.filter((x) => x !== k))} label={PERMISSIONS[k].label} description={PERMISSIONS[k].description} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamManager({ assistants }: { assistants: AssistantRow[] }) {
  const confirm = useConfirm();
  const { pending, exec } = useAction();
  const [create, setCreate] = React.useState(false);
  const [form, setForm] = React.useState({ fullName: "", username: "", password: genPw(), whatsapp: "", permissions: PERMISSION_PRESETS[0]!.permissions as string[] });
  const [created, setCreated] = React.useState<{ username: string; password: string } | null>(null);
  const [edit, setEdit] = React.useState<AssistantRow | null>(null);
  const [pw, setPw] = React.useState<{ id: string; name: string; value: string } | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button
          variant="accent"
          onClick={() => {
            setCreated(null);
            setForm({ fullName: "", username: "", password: genPw(), whatsapp: "", permissions: PERMISSION_PRESETS[0]!.permissions });
            setCreate(true);
          }}
        >
          <UserPlus className="size-4" /> Add assistant
        </Button>
      </div>
      {assistants.length === 0 && <EmptyState icon={<ShieldCheck />} title="No assistants yet" description="Create accounts for your assistants with a username & password, and choose exactly what each one can do." />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {assistants.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start gap-4">
              <Avatar name={a.fullName} src={a.avatar} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold">{a.fullName}</p>
                  {a.isActive ? <Badge tone="success" dot>Active</Badge> : <Badge tone="danger">Suspended</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">@{a.username}{a.whatsapp ? ` · ${formatPhone(a.whatsapp)}` : ""}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.device ? `Signed in on ${a.device}` : "Not signed in"}</p>
              </div>
              <Dropdown>
                <DropdownTrigger asChild>
                  <Button size="icon-sm" variant="ghost" aria-label="Actions">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownContent>
                  <DropdownItem onSelect={() => setEdit(a)}>
                    <Pencil /> Edit permissions
                  </DropdownItem>
                  <DropdownItem onSelect={() => setPw({ id: a.id, name: a.fullName, value: genPw() })}>
                    <KeyRound /> Set new password
                  </DropdownItem>
                  <DropdownItem onSelect={() => exec(() => forceLogoutAction(a.id))}>
                    <LogOut /> Sign out of device
                  </DropdownItem>
                  <DropdownItem onSelect={() => exec(() => setUserActiveAction(a.id, !a.isActive))}>
                    {a.isActive ? <UserX /> : <UserCheck />} {a.isActive ? "Suspend" : "Activate"}
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem
                    danger
                    onSelect={async () => {
                      if (await confirm({ title: `Remove ${a.fullName}?`, description: "Their account is deleted. Their past actions stay in the activity log.", danger: true, confirmLabel: "Remove assistant" })) exec(() => deleteAssistantAction(a.id));
                    }}
                  >
                    <Trash2 /> Remove
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {a.permissions.length === 0 && <span className="text-xs text-muted-foreground">No permissions — can only see the dashboard.</span>}
              {a.permissions.map((p) => (
                <Badge key={p} tone="brand">{PERMISSIONS[p as Permission]?.label ?? p}</Badge>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={create} onOpenChange={setCreate}>
        <DialogContent size="lg" title={created ? "Assistant created" : "Add an assistant"} description={created ? "Share these login details privately." : "They'll sign in with this username and password."}>
          {created ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="text-sm">Username: <b className="font-mono">{created.username}</b></p>
                <p className="text-sm">Password: <b className="font-mono">{created.password}</b></p>
              </div>
              <CopyButton value={`Bioacademy staff login\nUsername: ${created.username}\nPassword: ${created.password}`} label="Login details" />
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                exec(() => createAssistantAction(form), { onSuccess: (d) => d && setCreated(d) });
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name" icon={<User />} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value, username: form.username || "" })} required />
                <Field label="Username" icon={<AtSign />} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, "") })} required hint="letters, numbers, . _ -" />
                <Field label="Password" icon={<KeyRound />} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} hint="Auto-generated — you can change it" />
                <Field label="WhatsApp (optional)" icon={<WhatsAppIcon />} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
              <div>
                <Label>Permissions</Label>
                <PermissionPicker value={form.permissions} onChange={(p) => setForm({ ...form, permissions: p })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Create assistant
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        {edit && (
          <DialogContent size="lg" title={`Permissions — ${edit.fullName}`} description="Changes apply on their next page load.">
            <EditAssistant a={edit} pending={pending} onSave={(v) => exec(() => updateAssistantAction(edit.id, v), { onSuccess: () => setEdit(null) })} />
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!pw} onOpenChange={(o) => !o && setPw(null)}>
        {pw && (
          <DialogContent title={`New password for ${pw.name}`} description="They'll be signed out and must use the new password.">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                exec(() => setAssistantPasswordAction(pw.id, pw.value), { onSuccess: () => setPw(null) });
              }}
              className="space-y-4"
            >
              <Field label="New password" value={pw.value} onChange={(e) => setPw({ ...pw, value: e.target.value })} minLength={8} required />
              <div className="flex justify-between gap-2">
                <CopyButton value={pw.value} label="Password" />
                <Button type="submit" loading={pending}>
                  Set password
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function EditAssistant({ a, onSave, pending }: { a: AssistantRow; onSave: (v: { fullName: string; permissions: string[]; whatsapp?: string }) => void; pending: boolean }) {
  const [v, setV] = React.useState({ fullName: a.fullName, permissions: a.permissions, whatsapp: a.whatsapp ?? "" });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v);
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" value={v.fullName} onChange={(e) => setV({ ...v, fullName: e.target.value })} required />
        <Field label="WhatsApp" value={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.value })} />
      </div>
      <PermissionPicker value={v.permissions} onChange={(p) => setV({ ...v, permissions: p })} />
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          Save permissions
        </Button>
      </div>
    </form>
  );
}
