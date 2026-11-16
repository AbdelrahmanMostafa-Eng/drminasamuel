import { MonitorSmartphone, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionState, requireUser } from "@/lib/auth";
import { fmt } from "@/lib/time";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PasswordForm } from "@/components/auth/password-form";
import { ProfileForm } from "@/components/auth/profile-form";
import { fileUrl } from "@/lib/utils";

export default async function ProfilePage() {
  const user = await requireUser();
  const s = await getSessionState();
  const session = s.status === "active" ? await db.session.findUnique({ where: { id: s.sessionId } }) : null;
  return (
    <>
      <PageHeader eyebrow="Account" title="Profile & security" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title="Personal information" />
          <CardBody>
            <ProfileForm
              user={{ fullName: user.fullName, email: user.email, whatsapp: user.whatsapp, parentPhone: user.parentPhone, school: user.school, avatar: fileUrl(user.avatarKey), role: user.role, username: user.username }}
            />
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="This device" icon={<MonitorSmartphone />} description="Your account works on one device at a time." />
            <CardBody className="text-sm">
              <p className="font-semibold">{session?.device ?? "Unknown device"}</p>
              <p className="text-muted-foreground">Signed in {session ? fmt(session.createdAt) : "—"}</p>
              <p className="mt-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground">Signing in on another phone or laptop will automatically sign this device out.</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Change password" icon={<ShieldCheck />} />
            <CardBody>
              <PasswordForm />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
