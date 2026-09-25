export type Role = "master_admin" | "co_admin" | "student"

export type AdminScope =
  | "courses"
  | "assignments"
  | "grading"
  | "sessions"
  | "students"
  | "payments"
  | "reports"

export const ALL_SCOPES: AdminScope[] = [
  "courses",
  "assignments",
  "grading",
  "sessions",
  "students",
  "payments",
  "reports",
]

export interface Profile {
  id: string
  role: Role
  fullName: string
  email: string
  whatsapp: string
  password: string
  status: "active" | "suspended"
  createdAt: string
  lastLoginAt?: string
  deviceId?: string
  deviceLabel?: string
  scopes: AdminScope[]
  avatarSeed: string
}

export type CourseType = "basics" | "advanced"

export interface Course {
  id: string
  slug: string
  title: string
  type: CourseType
  tagline: string
  description: string
  priceEGP: number
  batchLabel: string
  prerequisiteCourseId?: string
  whatsappLink: string
  status: "open" | "closed" | "archived"
  startDate: string
  endDate: string
  highlights: string[]
  coverImage: string
  bookTitle?: string
  bookPages?: number
  bookUrl?: string
  createdAt: string
}

export interface Chapter {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  published: boolean
}

export interface Lesson {
  id: string
  chapterId: string
  courseId: string
  title: string
  description: string
  order: number
  published: boolean
  durationMin: number
  videoUrl?: string
  pdfUrl?: string
  pdfPages?: number
}

export type AssignmentKind = "homework" | "quiz"

export interface Assignment {
  id: string
  courseId: string
  chapterId: string
  lessonId?: string
  kind: AssignmentKind
  title: string
  deadline: string
  totalPoints: number
  /** 0 means unlimited */
  maxAttempts: number
  showCorrectAnswers: boolean
  published: boolean
}

export interface Question {
  id: string
  assignmentId: string
  text: string
  options: string[]
  correctIndex: number
  order: number
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  answers: (number | null)[]
  score: number
  submittedAt: string
  attempt: number
}

export type PaymentMethod = "instapay" | "vodafone_cash"
export type PaymentGateway = "paymob" | "kashier"
export type PaymentStatus = "pending" | "success" | "declined" | "timeout"

export interface PaymentTransaction {
  id: string
  studentId: string
  courseId: string
  gateway: PaymentGateway
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  gatewayRef: string
  createdAt: string
  completedAt?: string
  failureReason?: string
}

export interface Enrollment {
  id: string
  studentId: string
  courseId: string
  status: "paid" | "refunded"
  amountPaid: number
  enrolledAt: string
  transactionId: string
  completedAt?: string
}

export interface LiveSession {
  id: string
  courseId: string
  chapterId?: string
  title: string
  zoomLink: string
  startsAt: string
  endsAt: string
  endedManuallyAt?: string
  createdBy: string
}

export interface Attendance {
  id: string
  sessionId: string
  studentId: string
  status: "present" | "absent"
  joinedAt?: string
  excuse?: string
  excuseAt?: string
}

export type ReportKind = "attendance" | "grades" | "archive"

export interface GeneratedReport {
  id: string
  courseId: string
  kind: ReportKind
  title: string
  createdAt: string
  createdBy: string
  sizeKB: number
  sessionId?: string
  assignmentId?: string
  rows: Record<string, string | number>[]
  columns: string[]
}

export interface LessonProgress {
  studentId: string
  lessonId: string
  watchedAt: string
}

export interface Announcement {
  id: string
  courseId: string
  title: string
  body: string
  createdAt: string
  authorId: string
}

export interface AuditEntry {
  id: string
  actorId: string
  actorName: string
  action: string
  target: string
  at: string
}

export interface QAThread {
  id: string
  lessonId: string
  studentId: string
  question: string
  createdAt: string
  answer?: string
  answeredBy?: string
  answeredAt?: string
  approved: boolean
}

export interface AppState {
  version: number
  currentUserId: string | null
  deviceId: string
  profiles: Profile[]
  courses: Course[]
  chapters: Chapter[]
  lessons: Lesson[]
  assignments: Assignment[]
  questions: Question[]
  submissions: Submission[]
  transactions: PaymentTransaction[]
  enrollments: Enrollment[]
  sessions: LiveSession[]
  attendance: Attendance[]
  reports: GeneratedReport[]
  progress: LessonProgress[]
  announcements: Announcement[]
  audit: AuditEntry[]
  qa: QAThread[]
}
