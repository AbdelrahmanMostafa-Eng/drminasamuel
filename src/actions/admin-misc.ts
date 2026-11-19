"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ActionError, actionMaster, actionStaff, run } from "@/lib/auth";
import { audit, notifyCourseStudents, notifyUsers } from "@/lib/audit";
import { saveSettings, type SiteSettings } from "@/lib/settings";
import { normalizePhone, ensureUrl } from "@/lib/utils";

const annSchema = z.object({
  courseId: z.string().nullable().optional(),
  title: z.string().trim().min(2, "Add a title.").max(140),
  body: z.string().trim().min(2, "Write the announcement.").max(5000),
  isPinned: z.boolean().default(false),
});

export async function saveAnnouncementAction(id: string | null, input: z.input<typeof annSchema>) {
  return run(async () => {
    const me = await actionStaff("announcements");
    const d = annSchema.parse(input);
    if (id) {
      await db.announcement.update({ where: { id }, data: { title: d.title, body: d.body, isPinned: d.isPinned, courseId: d.courseId || null } });
    } else {
      await db.announcement.create({ data: { title: d.title, body: d.body, isPinned: d.isPinned, courseId: d.courseId || null, authorId: me.id } });
      const n = { title: `📣 ${d.title}`, body: d.body.slice(0, 140), link: d.courseId ? `/dashboard/courses/${d.courseId}` : "/dashboard" };
      if (d.courseId) await notifyCourseStudents(d.courseId, n);
      else {
        const students = await db.enrollment.findMany({ where: { status: "APPROVED", course: { status: "PUBLISHED" } }, select: { userId: true }, distinct: ["userId"] });
        await notifyUsers(students.map((s) => s.userId), n);
      }
      await audit(me, "announcement.posted", d.title);
    }
    revalidatePath("/admin/announcements");
  }, id ? "Announcement updated" : "Announcement posted & students notified");
}

export async function deleteAnnouncementAction(id: string) {
  return run(async () => {
    await actionStaff("announcements");
    await db.announcement.delete({ where: { id } });
    revalidatePath("/admin/announcements");
  }, "Deleted");
}

export async function saveSettingsAction<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
  return run(async () => {
    const me = await actionMaster();
    let v: unknown = value;
    if (key === "team") {
      v = (value as SiteSettings["team"]).map((t) => {
        const phone = normalizePhone(t.phone);
        if (!phone) throw new ActionError(`Invalid number for ${t.name || "a contact"}.`);
        return { name: t.name.trim(), phone, role: t.role?.trim() || undefined };
      });
    }
    if (key === "centers") v = (value as SiteSettings["centers"]).map((c) => ({ name: c.name.trim(), area: c.area.trim(), mapUrl: ensureUrl(c.mapUrl) }));
    if (key === "social") v = Object.fromEntries(Object.entries(value as SiteSettings["social"]).map(([k, u]) => [k, u ? ensureUrl(u) : ""]));
    if (key === "teacherPhone") {
      const raw = String(value ?? "").trim();
      const phone = raw ? normalizePhone(raw) : "";
      if (raw && !phone) throw new ActionError("That phone number looks invalid.");
      v = phone;
    }
    if (key === "about") {
      const ab = value as SiteSettings["about"];
      v = { title: ab.title.trim(), body: ab.body.trim(), points: ab.points.map((x) => x.trim()).filter(Boolean) };
    }
    if (key === "pricing") {
      const p = value as SiteSettings["pricing"];
      if (p.plans.length > 4) throw new ActionError("Up to 4 price cards fit on the page.");
      v = {
        show: !!p.show,
        title: p.title.trim() || "Pricing",
        plans: p.plans.map((c, i) => {
          if (!c.label.trim() || !c.price.trim()) throw new ActionError(`Card ${i + 1} needs a name and a price.`);
          const link = c.buttonLink.trim() || "/courses";
          return {
            label: c.label.trim(),
            price: c.price.trim(),
            unit: c.unit.trim(),
            note: c.note.trim(),
            features: c.features.map((f) => f.trim()).filter(Boolean).slice(0, 10),
            buttonLabel: c.buttonLabel.trim() || "Enroll",
            buttonLink: link.startsWith("/") || link.startsWith("#") ? link : ensureUrl(link),
            featured: !!c.featured,
          };
        }),
      };
    }
    if (key === "testSites") v = Object.fromEntries(Object.entries(value as SiteSettings["testSites"]).map(([k, u]) => [k, u ? ensureUrl(u) : ""]));
    await saveSettings({ [key]: v } as Partial<SiteSettings>);
    await audit(me, "settings.updated", String(key));
    revalidatePath("/", "layout");
  }, "Settings saved");
}

export async function removeSampleDataAction() {
  return run(async () => {
    const me = await actionMaster();
    await db.report.deleteMany({ where: { course: { isSample: true } } });
    const courses = await db.course.deleteMany({ where: { isSample: true } });
    const users = await db.user.deleteMany({ where: { isSample: true, role: { not: "MASTER" } } });
    await audit(me, "sample_data.removed", `${courses.count} courses, ${users.count} users`);
    revalidatePath("/", "layout");
    return { courses: courses.count, users: users.count };
  });
}

