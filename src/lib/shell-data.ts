import "server-only";
import { db } from "./db";

export async function shellNotifications(userId: string) {
  const [list, unread] = await Promise.all([
    db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);
  return {
    unread,
    notifications: list.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() })),
  };
}
