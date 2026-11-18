"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AtSign, Phone, School, User } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { uploadFile } from "@/components/ui/file-upload";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { updateProfileAction } from "@/actions/auth";

export function ProfileForm({
  user,
}: {
  user: { fullName: string; email: string | null; whatsapp: string | null; parentPhone: string | null; school: string | null; avatar: string | null; role: string; username: string | null };
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [avatar, setAvatar] = React.useState(user.avatar);
  const [avatarKey, setAvatarKey] = React.useState<string | undefined>(undefined);
  const [uploading, setUploading] = React.useState(false);
  const student = user.role === "STUDENT";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        start(async () => {
          const r = await updateProfileAction({ fullName: f.fullName ?? "", email: f.email, parentPhone: f.parentPhone, school: f.school, avatarKey });
          if (!r.ok) return void toast.error(r.error);
          toast.success("Profile saved");
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4">
        <Avatar name={user.fullName} src={avatar} size={72} />
        <label className="cursor-pointer rounded-xl border border-border px-3.5 py-2 text-sm font-semibold transition hover:bg-muted">
          {uploading ? "Uploading…" : "Change photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const up = await uploadFile(file, "avatar");
                setAvatarKey(up.key);
                setAvatar(URL.createObjectURL(file));
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
      </div>
      <Field name="fullName" label="Full name" icon={<User />} defaultValue={user.fullName} required />
      {!student && user.username && <Field label="Username" icon={<AtSign />} defaultValue={user.username} disabled />}
      <Field name="email" type="email" label="Email" icon={<AtSign />} defaultValue={user.email ?? ""} required={student} />
      {student && (
        <>
          <Field label="WhatsApp number" icon={<WhatsAppIcon />} defaultValue={user.whatsapp ?? ""} disabled hint="To change your WhatsApp number, contact an assistant." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field name="parentPhone" type="tel" label="Parent's number" icon={<Phone />} defaultValue={user.parentPhone ?? ""} required />
            <Field name="school" label="School" icon={<School />} defaultValue={user.school ?? ""} />
          </div>
        </>
      )}
      <Button type="submit" loading={pending} disabled={uploading}>
        Save changes
      </Button>
    </form>
  );
}
