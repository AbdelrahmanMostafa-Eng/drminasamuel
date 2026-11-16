import { db } from "@/lib/db";
import { requireMaster } from "@/lib/auth";
import { fileUrl } from "@/lib/utils";
import { PageHeader } from "@/components/ui/misc";
import { TeamManager } from "@/components/admin/team-manager";

export default async function TeamPage() {
  await requireMaster();
  const list = await db.user.findMany({
    where: { role: "ASSISTANT" },
    orderBy: { createdAt: "asc" },
    include: { sessions: { where: { revokedAt: null }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <>
      <PageHeader eyebrow="Administration" title="Team & permissions" description="Create co-admin accounts for your assistants and control exactly what each one can see and change." />
      <TeamManager
        assistants={list.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          username: a.username ?? "",
          whatsapp: a.whatsapp,
          permissions: a.permissions,
          isActive: a.isActive,
          lastLogin: a.lastLoginAt?.toISOString() ?? null,
          device: a.sessions[0]?.device ?? null,
          avatar: fileUrl(a.avatarKey),
        }))}
      />
    </>
  );
}
