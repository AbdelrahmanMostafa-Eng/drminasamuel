"use client";

import { BookOpen, ClipboardList, Settings, Users, Video } from "lucide-react";
import { LinkTabs } from "@/components/ui/tabs";

export function CourseTabs({ id, pending }: { id: string; pending: number }) {
  const base = `/admin/courses/${id}`;
  return (
    <LinkTabs
      id="course-tabs"
      tabs={[
        { href: base, label: "Content", icon: <BookOpen />, exact: true },
        { href: `${base}/sessions`, label: "Live sessions", icon: <Video /> },
        { href: `${base}/students`, label: "Students", icon: <Users />, count: pending },
        { href: `${base}/gradebook`, label: "Gradebook", icon: <ClipboardList /> },
        { href: `${base}/settings`, label: "Settings", icon: <Settings /> },
      ]}
    />
  );
}
