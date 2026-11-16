export const PERMISSIONS = {
  courses: { label: "Courses", description: "Create & edit courses, prices, covers and WhatsApp group links" },
  content: { label: "Content", description: "Chapters, lessons, PDFs, recorded videos and course books" },
  assessments: { label: "Homework & quizzes", description: "Build homework and quizzes, set correct answers" },
  grades: { label: "Grades", description: "View all students' results and gradebooks" },
  sessions: { label: "Live sessions", description: "Schedule sessions, post Zoom links, end sessions" },
  attendance: { label: "Attendance", description: "View attendance, read excuses, adjust attendance" },
  payments: { label: "Payments", description: "Review payment screenshots, approve or reject enrollments" },
  students: { label: "Students", description: "View students, reset passwords & devices, remove from courses" },
  reports: { label: "PDF reports", description: "Generate and download attendance & grade PDFs" },
  announcements: { label: "Announcements", description: "Post announcements to enrolled students" },
  analytics: { label: "Analytics", description: "See study-progress analytics dashboards" },
  revenue: { label: "Revenue", description: "See revenue figures and payment totals" },
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export const PERMISSION_PRESETS: { name: string; permissions: Permission[] }[] = [
  { name: "Full assistant", permissions: ALL_PERMISSIONS.filter((p) => p !== "revenue") },
  { name: "Content & assessments", permissions: ["content", "assessments", "grades", "reports", "analytics"] },
  { name: "Sessions & attendance", permissions: ["sessions", "attendance", "reports", "announcements"] },
  { name: "Payments desk", permissions: ["payments", "students"] },
];

type Who = { role: string; permissions: string[] } | null | undefined;

export function can(user: Who, perm: Permission) {
  if (!user) return false;
  if (user.role === "MASTER") return true;
  if (user.role !== "ASSISTANT") return false;
  return user.permissions.includes(perm);
}

export function isStaff(user: Who) {
  return !!user && (user.role === "MASTER" || user.role === "ASSISTANT");
}
