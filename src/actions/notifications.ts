"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionUser, run } from "@/lib/auth";

export async function markAllNotificationsRead() {
  return run(async () => {
    const me = await actionUser();
    await db.notification.updateMany({ where: { userId: me.id, readAt: null }, data: { readAt: new Date() } });
    revalidatePath("/", "layout");
  });
}

export async function markNotificationRead(id: string) {
  return run(async () => {
    const me = await actionUser();
    await db.notification.updateMany({ where: { id, userId: me.id }, data: { readAt: new Date() } });
  });
}
