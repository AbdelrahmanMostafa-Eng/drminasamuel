import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export const APP_TZ = "Africa/Cairo";

/** "2026-11-20T18:00" (Cairo wall time) -> Date (UTC instant) */
export function parseLocalInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = fromZonedTime(value, APP_TZ);
  return isNaN(d.getTime()) ? null : d;
}

/** Date -> "2026-11-20T18:00" in Cairo time, for <input type="datetime-local"> */
export function toLocalInput(date: Date | null | undefined) {
  if (!date) return "";
  return formatInTimeZone(date, APP_TZ, "yyyy-MM-dd'T'HH:mm");
}

export function toLocalDateInput(date: Date | null | undefined) {
  if (!date) return "";
  return formatInTimeZone(date, APP_TZ, "yyyy-MM-dd");
}

export function fmt(date: Date | string | null | undefined, pattern = "EEE, d MMM yyyy · h:mm a") {
  if (!date) return "—";
  return formatInTimeZone(new Date(date), APP_TZ, pattern);
}

export function fmtDate(date: Date | string | null | undefined) {
  return fmt(date, "d MMM yyyy");
}

export function fmtTime(date: Date | string | null | undefined) {
  return fmt(date, "h:mm a");
}

export function zoned(date: Date) {
  return toZonedTime(date, APP_TZ);
}

export function dayKey(date: Date) {
  return formatInTimeZone(date, APP_TZ, "yyyy-MM-dd");
}

export function relative(date: Date | string, now = new Date()) {
  const d = new Date(date);
  const diff = d.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  let s: string;
  if (mins < 1) return "just now";
  if (mins < 60) s = `${mins} min`;
  else if (hours < 24) s = `${hours} hr${hours > 1 ? "s" : ""}`;
  else s = `${days} day${days > 1 ? "s" : ""}`;
  return diff > 0 ? `in ${s}` : `${s} ago`;
}
