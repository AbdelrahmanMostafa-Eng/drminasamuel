"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Banknote, Globe, HelpCircle, Home, MapPin, Plus, Save, Smartphone, Sparkles, Tags, Trash2, Users } from "lucide-react";
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

const BLANK_PLAN: SiteSettings["pricing"]["plans"][number] = { label: "", price: "", unit: "EGP / course", note: "", features: [], buttonLabel: "Enroll", buttonLink: "/courses", featured: false };

/** Price cards on the homepage: edit, add (up to 4), remove, reorder, highlight. */
function PricingEditor({ initial }: { initial: SiteSettings["pricing"] }) {
  const pr = useSection("pricing", initial);
  const v = pr.value;
  const setPlans = (plans: SiteSettings["pricing"]["plans"]) => pr.setValue({ ...v, plans });
  const setPlan = (i: number, patch: Partial<SiteSettings["pricing"]["plans"][number]>) => setPlans(v.plans.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= v.plans.length) return;
    const a = [...v.plans];
    [a[i], a[j]] = [a[j], a[i]];
    setPlans(a);
  };
  return (
    <Card className="xl:col-span-2">
      <CardHeader title="Pricing cards" description="The price cards on the homepage (and the Pricing link in the header). Course prices charged at enrollment are set on each course." icon={<Tags />} />
      <CardBody className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Switch checked={v.show} onChange={(b) => pr.setValue({ ...v, show: b })} label="Show the pricing section" description="When off, the section and its header link are hidden." />
          <Field label="Section title" value={v.title} onChange={(e) => pr.setValue({ ...v, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {v.plans.map((p, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Card {String(i + 1).padStart(2, "0")}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left">
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === v.plans.length - 1} aria-label="Move right">
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" className="hover:text-danger" onClick={() => setPlans(v.plans.filter((_, k) => k !== i))} aria-label="Remove card">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Card name" value={p.label} onChange={(e) => setPlan(i, { label: e.target.value })} hint="e.g. Basics · Level 01" />
                <Field label="Price" value={p.price} onChange={(e) => setPlan(i, { price: e.target.value })} hint="e.g. 6,000" />
                <Field label="Price unit" value={p.unit} onChange={(e) => setPlan(i, { unit: e.target.value })} hint="e.g. EGP / course" />
                <Field label="Short note" value={p.note} onChange={(e) => setPlan(i, { note: e.target.value })} />
              </div>
              <TextArea label="Features (one per line)" rows={5} value={p.features.join("\n")} onChange={(e) => setPlan(i, { features: e.target.value.split("\n") })} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Button text" value={p.buttonLabel} onChange={(e) => setPlan(i, { buttonLabel: e.target.value })} />
                <Field label="Button link" value={p.buttonLink} onChange={(e) => setPlan(i, { buttonLink: e.target.value })} hint="/courses, /contact, /register or a full link" />
              </div>
              <Switch checked={p.featured} onChange={(b) => setPlan(i, { featured: b })} label="Highlight this card" description="Gives it the black button." />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" size="sm" disabled={v.plans.length >= 4} onClick={() => setPlans([...v.plans, { ...BLANK_PLAN }])}>
            <Plus className="size-4" /> Add card {v.plans.length >= 4 && "(max 4)"}
          </Button>
          <SaveBar pending={pr.pending} onSave={pr.save} />
        </div>
      </CardBody>
    </Card>
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
  const teacherPhone = useSection("teacherPhone", settings.teacherPhone);
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
          <TextArea label="Key points (one per line)" rows={4} value={about.value.points.join("\n")} onChange={(e) => about.setValue({ ...about.value, points: e.target.value.split("\n") })} />
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
          <div className="border-t border-border pt-4">
            <Field label="Dr. Mina's number (under the social links)" icon={<Smartphone />} value={teacherPhone.value} onChange={(e) => teacherPhone.setValue(e.target.value)} hint="Shown in the website footer as a WhatsApp link." />
            <SaveBar pending={teacherPhone.pending} onSave={teacherPhone.save} />
          </div>
          <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <Field label="ACT website" value={sites.value.act} onChange={(e) => sites.setValue({ ...sites.value, act: e.target.value })} />
            <Field label="EST website" value={sites.value.est} onChange={(e) => sites.setValue({ ...sites.value, est: e.target.value })} />
          </div>
          <SaveBar pending={sites.pending} onSave={sites.save} />
        </CardBody>
      </Card>

      <PricingEditor initial={settings.pricing} />

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
