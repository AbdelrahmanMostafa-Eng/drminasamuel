import { requireMaster } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/misc";
import { SettingsForms } from "@/components/admin/settings-forms";

export default async function SettingsPage() {
  await requireMaster();
  const [settings, sampleCount] = await Promise.all([getSettings(), db.course.count({ where: { isSample: true } })]);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Website settings" description="Payment numbers, homepage text, team contacts, centers, social links and FAQ — all editable here." />
      <SettingsForms settings={settings} sampleCount={sampleCount} />
    </>
  );
}
