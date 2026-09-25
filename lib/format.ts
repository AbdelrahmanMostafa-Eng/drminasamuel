import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday } from "date-fns"

export function egp(amount: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount)
}

export function fmtDate(iso: string) {
  return format(new Date(iso), "d MMM yyyy")
}

export function fmtDateTime(iso: string) {
  return format(new Date(iso), "d MMM yyyy · h:mm a")
}

export function fmtTime(iso: string) {
  return format(new Date(iso), "h:mm a")
}

export function fmtRelativeDay(iso: string) {
  const d = new Date(iso)
  if (isToday(d)) return "Today"
  if (isTomorrow(d)) return "Tomorrow"
  if (isYesterday(d)) return "Yesterday"
  return format(d, "EEE, d MMM")
}

export function fmtCountdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return "Closed"
  return `${formatDistanceToNowStrict(new Date(iso))} left`
}

export function fmtAgo(iso: string) {
  return `${formatDistanceToNowStrict(new Date(iso))} ago`
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
}

export function toLocalInputValue(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
