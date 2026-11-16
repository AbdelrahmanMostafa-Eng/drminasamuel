"use client";

import * as React from "react";
import { Banknote, Globe, HelpCircle, Home, MapPin, Plus, Save, Smartphone, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, TextArea } from "@/components/ui/input";
import { Switch } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { removeSampleDataAction, saveSettingsAction } from "@/actions/admin-misc";
import type { SiteSettings } from "@/lib/settings";
import { useAction } from "./use-action";

function useSection<K extends keyof SiteSettings>(key: K, initial: SiteSettings[K]) {
  const [value, setValue] = React.useState(initial);
  const { pending, exec } = useAction();
  const save = () => exec(() => saveSettingsAction(key, value));
  return { value, setValue, pending, save };
}

function SaveBar({ pending, onSave }: { pending: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onSave} loading={pending}>
        <Save className="size-4" /> Save
      </Button>
    </div>
  );
}

function ListEditor<T extends Record<string, string | undefined>>({ items, onChange, fields, make, addLabel }: { items: T[]; onChange: (v: T[]) => void; fields: { key: keyof T; label: string; wide?: boolean; textarea?: boolean }[]; make: () => T; addLabel: string }) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-2 rounded-2xl border border-border p-3">
          <div className="grid grid-cols-1 flex-1 gap-3 sm:grid-cols-2">
            {fields.map((f) =>
              f.textarea ? (
                <TextArea key={String(f.key)} label={f.label} rows={3} containerClassName="sm:col-span-2" value={it[f.key] ?? ""} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, [f.key]: e.target.value } : x)))} />
              ) : (
                <Field key={String(f.key)} label={f.label} containerClassName={f.wide ? "sm:col-span-2" : ""} value={it[f.key] ?? ""} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, [f.key]: e.target.value } : x)))} />
              ),
            )}
          </div>
          <Button size="icon-sm" variant="ghost" className="mt-2 hover:text-danger" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Remove">
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={() => onChange([...items, make()])}>
        <Plus className="size-4" /> {addLabel}
      </Button>
    </div>
  );
}

export function SettingsForms({ settings, sampleCount }: { settings: SiteSettings; sampleCount: number }) {
  const payment = useSection("payment", settings.payment);
  const hero = useSection("hero", settings.hero);
  const about = useSection("about", settings.about);
  const stats = useSection("stats", settings.stats);
  const team = useSection("team", settings.team);
  const centers = useSection("centers", settings.centers);
  const social = useSection("social", settings.social);
  const sites = useSection("testSites", settings.testSites);
  const faqs = useSection("faqs", settings.faqs);
  const sched = useSection("showPublicSchedule", settings.showPublicSchedule);
  const confirm = useConfirm();
  const sample = useAction();

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="xl:col-span-2">
        <CardHeader title="Payment details" description="Shown to students on the enrollment page" icon={<Banknote />} />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="InstaPay address (IPA)" value={payment.value.instapayHandle} onChange={(e) => payment.setValue({ ...payment.value, instapayHandle: e.target.value })} hint="e.g. minasamuel@instapay" />
            <Field label="InstaPay mobile number" value={payment.value.instapayPhone} onChange={(e) => payment.setValue({ ...payment.value, instapayPhone: e.target.value })} />
            <Field label="InstaPay payment link (optional)" value={payment.value.instapayLink} onChange={(e) => payment.setValue({ ...payment.value, instapayLink: e.target.value })} hint="https://ipn.eg/S/…" />
            <Field label="Vodafone Cash number" icon={<Smartphone />} value={payment.value.vodafoneCashNumber} onChange={(e) => payment.setValue({ ...payment.value, vodafoneCashNumber: e.target.value })} />
            <Field label="Account holder name" value={payment.value.accountName} onChange={(e) => payment.setValue({ ...payment.value, accountName: e.target.value })} />
          </div>
          <TextArea label="Instructions for students" rows={3} value={payment.value.instructions} onChange={(e) => payment.setValue({ ...payment.value, instructions: e.target.value })} />
          <SaveBar pending={payment.pending} onSave={payment.save} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Homepage hero" icon={<Home />} />
        <CardBody className="space-y-4">
          <Field label="Small label" value={hero.value.eyebrow} onChange={(e) => hero.setValue({ ...hero.value, eyebrow: e.target.value })} />
          <Field label="Headline" value={hero.value.title} onChange={(e) => hero.setValue({ ...hero.value, title: e.target.value })} />
          <Field label="Highlighted line (orange italic)" value={hero.value.highlight} onChange={(e) => hero.setValue({ ...hero.value, highlight: e.target.value })} />
          <TextArea label="Subtitle" rows={4} value={hero.value.subtitle} onChange={(e) => hero.setValue({ ...hero.value, subtitle: e.target.value })} />
          <SaveBar pending={hero.pending} onSave={hero.save} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="About Dr. Mina" icon={<Sparkles />} />
        <CardBody className="space-y-4">
          <Field label="Section title" value={about.value.title} onChange={(e) => about.setValue({ ...about.value, title: e.target.value })} />
          <TextArea label="Bio" rows={5} value={about.value.body} onChange={(e) => about.setValue({ ...about.value, body: e.target.value })} />
          <TextArea label="Key points (one per line)" rows={4} value={about.value.points.join("\n")} onChange={(e) => about.setValue({ ...about.value, points: e.target.value.split("\n").filter((x) => x.trim()) })} />
          <SaveBar pending={about.pending} onSave={about.save} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Homepage numbers" icon={<Sparkles />} />
        <CardBody>
          <ListEditor items={stats.value} onChange={stats.setValue} fields={[{ key: "value", label: "Number" }, { key: "label", label: "Label" }]} make={() => ({ value: "", label: "" })} addLabel="Add stat" />
          <SaveBar pending={stats.pending} onSave={stats.save} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Team contacts (WhatsApp)" description="Shown on the homepage, contact page and footer" icon={<Users />} />
        <CardBody>
          <ListEditor items={team.value as { name: string; phone: string; role?: string }[]} onChange={team.setValue} fields={[{ key: "name", label: "Name" }, { key: "phone", label: "WhatsApp number" }]} make={() => ({ name: "", phone: "" })} addLabel="Add contact" />
          <SaveBar pending={team.pending} onSave={team.save} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Center locations" icon={<MapPin />} />
        <CardBody>
          <ListEditor items={centers.value} onChange={centers.setValue} fields={[{ key: "name", label: "Center name" }, { key: "area", label: "Area" }, { key: "mapUrl", label: "Google Maps link", wide: true }]} make={() => ({ name: "", area: "", mapUrl: "" })} addLabel="Add center" />
          <SaveBar pending={centers.pending} onSave={centers.save} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Social media & test websites" icon={<Globe />} />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["facebook", "instagram", "tiktok", "youtube"] as const).map((k) => (
              <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={social.value[k]} onChange={(e) => social.setValue({ ...social.value, [k]: e.target.value })} />
            ))}
          </div>
          <SaveBar pending={social.pending} onSave={social.save} />
          <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <Field label="ACT website" value={sites.value.act} onChange={(e) => sites.setValue({ ...sites.value, act: e.target.value })} />
            <Field label="EST website" value={sites.value.est} onChange={(e) => sites.setValue({ ...sites.value, est: e.target.value })} />
          </div>
          <SaveBar pending={sites.pending} onSave={sites.save} />
        </CardBody>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader title="FAQ" icon={<HelpCircle />} />
        <CardBody>
          <ListEditor items={faqs.value} onChange={faqs.setValue} fields={[{ key: "q", label: "Question", wide: true }, { key: "a", label: "Answer", textarea: true }]} make={() => ({ q: "", a: "" })} addLabel="Add question" />
          <SaveBar pending={faqs.pending} onSave={faqs.save} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Public schedule" />
        <CardBody>
          <Switch
            checked={sched.value}
            onChange={(b) => {
              sched.setValue(b);
              setTimeout(() => saveSettingsAction("showPublicSchedule", b).then((r) => (r.ok ? toast.success("Saved") : toast.error(r.error))), 0);
            }}
            label="Show session times on the public website"
            description="Zoom links are never public — only titles and times."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Example data" description="Sample courses & students added so you can see how everything looks" />
        <CardBody>
          <p className="mb-4 text-sm text-muted-foreground">{sampleCount ? `${sampleCount} example course(s) and their sample students are on the platform.` : "No example data left."}</p>
          <Button
            variant="danger"
            disabled={!sampleCount}
            loading={sample.pending}
            onClick={async () => {
              if (await confirm({ title: "Remove all example data?", description: "Deletes the example courses (with their chapters, quizzes and sessions) and the sample student accounts. Your own content is not touched.", danger: true, confirmLabel: "Remove examples", typeToConfirm: "REMOVE" }))
                sample.exec(() => removeSampleDataAction(), { onSuccess: (r) => toast.success(`Removed ${r?.courses ?? 0} courses and ${r?.users ?? 0} sample accounts`) });
            }}
          >
            <Trash2 className="size-4" /> Remove example data
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
