import "server-only";
import { revalidatePath } from "next/cache";

/**
 * The public website (home, courses, course pages, schedule, contact) is served from cache.
 * Call this after staff change anything those pages show, so visitors see it right away.
 */
export function revalidatePublic() {
  revalidatePath("/", "layout");
}
