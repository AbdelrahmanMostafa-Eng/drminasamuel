"use client"

import * as React from "react"
import { createSeed, STATE_VERSION } from "./seed"
import type {
  AdminScope,
  AppState,
  Assignment,
  Chapter,
  Course,
  GeneratedReport,
  Lesson,
  LiveSession,
  PaymentMethod,
  Profile,
  Question,
} from "./types"

const STORAGE_KEY = "bioacademy.demo.state"
const DEVICE_KEY = "bioacademy.device"

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

const nowIso = () => new Date().toISOString()

function getDeviceId() {
  if (typeof window === "undefined") return "server"
  let id = window.localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = uid("dev")
    window.localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

function describeDevice() {
  if (typeof navigator === "undefined") return "Unknown device"
  const ua = navigator.userAgent
  const os = /iPhone|iPad/.test(ua)
    ? "iPhone"
    : /Android/.test(ua)
      ? "Android"
      : /Mac/.test(ua)
        ? "Mac"
        : /Windows/.test(ua)
          ? "Windows"
          : "Linux"
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Safari/.test(ua)
        ? "Safari"
        : /Firefox/.test(ua)
          ? "Firefox"
          : "Browser"
  return `${os} · ${browser}`
}

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string }

interface StoreApi {
  state: AppState
  hydrated: boolean
  currentUser: Profile | null
  // auth
  login: (email: string, password: string) => Result<Profile>
  signup: (input: { fullName: string; email: string; whatsapp: string; password: string }) => Result<Profile>
  logout: () => void
  requestPasswordReset: (email: string) => Result
  changePassword: (current: string, next: string) => Result
  // payments and enrollment
  startPayment: (courseId: string, method: PaymentMethod) => Result<string>
  completePayment: (transactionId: string, outcome: "success" | "declined" | "timeout") => Result
  // learning
  markLessonWatched: (lessonId: string) => void
  submitAssignment: (assignmentId: string, answers: (number | null)[]) => Result<{ score: number; total: number }>
  askQuestion: (lessonId: string, question: string) => Result
  // attendance
  joinSession: (sessionId: string) => Result<string>
  submitExcuse: (sessionId: string, excuse: string) => Result
  // admin: courses and content
  saveCourse: (course: Partial<Course> & { id?: string }) => Result<Course>
  saveChapter: (chapter: Partial<Chapter> & { courseId: string; id?: string }) => Result<Chapter>
  saveLesson: (lesson: Partial<Lesson> & { chapterId: string; courseId: string; id?: string }) => Result<Lesson>
  deleteChapter: (id: string) => void
  deleteLesson: (id: string) => void
  saveAssignment: (a: Partial<Assignment> & { courseId: string; chapterId: string; id?: string }) => Result<Assignment>
  deleteAssignment: (id: string) => void
  saveQuestion: (q: Partial<Question> & { assignmentId: string; id?: string }) => Result<Question>
  deleteQuestion: (id: string) => void
  // admin: sessions and reports
  saveSession: (s: Partial<LiveSession> & { courseId: string; id?: string }) => Result<LiveSession>
  endSession: (sessionId: string) => Result
  deleteSession: (sessionId: string) => void
  generateAttendanceReport: (sessionId: string) => Result<GeneratedReport>
  generateGradesReport: (assignmentId: string) => Result<GeneratedReport>
  // admin: people
  createCoAdmin: (input: { fullName: string; email: string; password: string; whatsapp: string; scopes: AdminScope[] }) => Result<Profile>
  updateScopes: (userId: string, scopes: AdminScope[]) => void
  setUserStatus: (userId: string, status: "active" | "suspended") => void
  deleteUsers: (userIds: string[]) => void
  forceDeviceReset: (userId: string) => void
  answerQuestion: (qaId: string, answer: string) => void
  setQaApproved: (qaId: string, approved: boolean) => void
  postAnnouncement: (courseId: string, title: string, body: string) => Result
  endOfCourseCleanup: (courseId: string) => Result<GeneratedReport>
  resetDemo: () => void
}

const StoreContext = React.createContext<StoreApi | null>(null)

function loadState(deviceId: string): AppState {
  if (typeof window === "undefined") return createSeed(Date.now(), deviceId)
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.version === STATE_VERSION) return { ...parsed, deviceId }
    }
  } catch {
    // corrupted state falls through to a fresh seed
  }
  return createSeed(Date.now(), deviceId)
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState>(() => createSeed(Date.now(), "server"))
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const deviceId = getDeviceId()
    setState(loadState(deviceId))
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  // One-device rule: if another tab/device signed in with this account, this tab is kicked out.
  React.useEffect(() => {
    if (!hydrated) return
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      const incoming = JSON.parse(e.newValue) as AppState
      setState((prev) => ({ ...incoming, deviceId: prev.deviceId }))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [hydrated])

  const currentUser = React.useMemo(() => {
    if (!state.currentUserId) return null
    const user = state.profiles.find((p) => p.id === state.currentUserId) ?? null
    if (!user) return null
    if (user.deviceId && user.deviceId !== state.deviceId) return null
    if (user.status === "suspended") return null
    return user
  }, [state.currentUserId, state.profiles, state.deviceId])

  const update = React.useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), [])

  const audit = (s: AppState, action: string, target: string): AppState => {
    const actor = s.profiles.find((p) => p.id === s.currentUserId)
    return {
      ...s,
      audit: [
        {
          id: uid("au"),
          actorId: actor?.id ?? "system",
          actorName: actor?.fullName ?? "System",
          action,
          target,
          at: nowIso(),
        },
        ...s.audit,
      ],
    }
  }

  const api: StoreApi = {
    state,
    hydrated,
    currentUser,

    login(email, password) {
      const user = state.profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase())
      if (!user || user.password !== password) return { ok: false, error: "Incorrect email or password." }
      if (user.status === "suspended") return { ok: false, error: "This account has been suspended. Contact your administrator." }
      const deviceLabel = describeDevice()
      update((s) => ({
        ...s,
        currentUserId: user.id,
        profiles: s.profiles.map((p) =>
          p.id === user.id ? { ...p, deviceId: s.deviceId, deviceLabel, lastLoginAt: nowIso() } : p
        ),
      }))
      return { ok: true, data: user }
    },

    signup({ fullName, email, whatsapp, password }) {
      if (state.profiles.some((p) => p.email.toLowerCase() === email.trim().toLowerCase())) {
        return { ok: false, error: "An account with this email already exists." }
      }
      const profile: Profile = {
        id: uid("u"),
        role: "student",
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        whatsapp,
        password,
        status: "active",
        createdAt: nowIso(),
        lastLoginAt: nowIso(),
        deviceId: state.deviceId,
        deviceLabel: describeDevice(),
        scopes: [],
        avatarSeed: fullName
          .trim()
          .split(/\s+/)
          .map((p) => p[0]?.toUpperCase() ?? "")
          .join("")
          .slice(0, 2),
      }
      update((s) => ({ ...s, currentUserId: profile.id, profiles: [...s.profiles, profile] }))
      return { ok: true, data: profile }
    },

    logout() {
      update((s) => ({
        ...s,
        currentUserId: null,
        profiles: s.profiles.map((p) => (p.id === s.currentUserId ? { ...p, deviceId: undefined } : p)),
      }))
    },

    requestPasswordReset(email) {
      const exists = state.profiles.some((p) => p.email.toLowerCase() === email.trim().toLowerCase())
      // Always succeed to avoid leaking which emails exist
      void exists
      return { ok: true, data: undefined }
    },

    changePassword(current, next) {
      if (!currentUser) return { ok: false, error: "Not signed in." }
      if (currentUser.password !== current) return { ok: false, error: "Current password is incorrect." }
      if (next.length < 8) return { ok: false, error: "New password must be at least 8 characters." }
      update((s) => ({
        ...s,
        profiles: s.profiles.map((p) => (p.id === currentUser.id ? { ...p, password: next } : p)),
      }))
      return { ok: true, data: undefined }
    },

    startPayment(courseId, method) {
      if (!currentUser) return { ok: false, error: "Sign in to enroll." }
      const course = state.courses.find((c) => c.id === courseId)
      if (!course) return { ok: false, error: "Course not found." }
      if (course.status !== "open") return { ok: false, error: "Enrollment for this course is closed." }
      if (state.enrollments.some((e) => e.studentId === currentUser.id && e.courseId === courseId && e.status === "paid")) {
        return { ok: false, error: "You are already enrolled in this course." }
      }
      if (course.prerequisiteCourseId) {
        const hasPrereq = state.enrollments.some(
          (e) => e.studentId === currentUser.id && e.courseId === course.prerequisiteCourseId && e.status === "paid"
        )
        if (!hasPrereq) return { ok: false, error: "You must complete the prerequisite course first." }
      }
      const id = uid("tx")
      update((s) => ({
        ...s,
        transactions: [
          {
            id,
            studentId: currentUser.id,
            courseId,
            gateway: "paymob",
            method,
            amount: course.priceEGP,
            status: "pending",
            gatewayRef: `PMB-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
            createdAt: nowIso(),
          },
          ...s.transactions,
        ],
      }))
      return { ok: true, data: id }
    },

    completePayment(transactionId, outcome) {
      const tx = state.transactions.find((t) => t.id === transactionId)
      if (!tx) return { ok: false, error: "Transaction not found." }
      const failureReason =
        outcome === "declined"
          ? tx.method === "vodafone_cash"
            ? "Insufficient wallet balance"
            : "Payment was rejected by your bank"
          : outcome === "timeout"
            ? "The payment window expired before confirmation"
            : undefined
      update((s) => {
        let next: AppState = {
          ...s,
          transactions: s.transactions.map((t) =>
            t.id === transactionId ? { ...t, status: outcome, completedAt: nowIso(), failureReason } : t
          ),
        }
        if (outcome === "success") {
          next = {
            ...next,
            enrollments: [
              ...next.enrollments,
              {
                id: uid("en"),
                studentId: tx.studentId,
                courseId: tx.courseId,
                status: "paid",
                amountPaid: tx.amount,
                enrolledAt: nowIso(),
                transactionId,
              },
            ],
          }
          next = audit(next, "Payment confirmed", `${tx.gatewayRef} · ${tx.amount} EGP`)
        }
        return next
      })
      return { ok: true, data: undefined }
    },

    markLessonWatched(lessonId) {
      if (!currentUser) return
      update((s) =>
        s.progress.some((p) => p.studentId === currentUser.id && p.lessonId === lessonId)
          ? s
          : { ...s, progress: [...s.progress, { studentId: currentUser.id, lessonId, watchedAt: nowIso() }] }
      )
    },

    submitAssignment(assignmentId, answers) {
      if (!currentUser) return { ok: false, error: "Sign in first." }
      const assignment = state.assignments.find((a) => a.id === assignmentId)
      if (!assignment) return { ok: false, error: "Assignment not found." }
      if (new Date(assignment.deadline).getTime() < Date.now()) {
        return { ok: false, error: "The deadline has passed. This assignment is locked." }
      }
      const attempts = state.submissions.filter((x) => x.assignmentId === assignmentId && x.studentId === currentUser.id)
      if (assignment.maxAttempts > 0 && attempts.length >= assignment.maxAttempts) {
        return { ok: false, error: "You have used all your attempts." }
      }
      const qs = state.questions.filter((q) => q.assignmentId === assignmentId).sort((a, b) => a.order - b.order)
      const correct = qs.filter((q, i) => answers[i] === q.correctIndex).length
      const score = qs.length ? Math.round((correct / qs.length) * assignment.totalPoints) : 0
      update((s) => ({
        ...s,
        submissions: [
          ...s.submissions,
          {
            id: uid("sub"),
            assignmentId,
            studentId: currentUser.id,
            answers,
            score,
            submittedAt: nowIso(),
            attempt: attempts.length + 1,
          },
        ],
      }))
      return { ok: true, data: { score, total: assignment.totalPoints } }
    },

    askQuestion(lessonId, question) {
      if (!currentUser) return { ok: false, error: "Sign in first." }
      if (question.trim().length < 8) return { ok: false, error: "Please write a fuller question." }
      update((s) => ({
        ...s,
        qa: [
          {
            id: uid("qa"),
            lessonId,
            studentId: currentUser.id,
            question: question.trim(),
            createdAt: nowIso(),
            approved: false,
          },
          ...s.qa,
        ],
      }))
      return { ok: true, data: undefined }
    },

    joinSession(sessionId) {
      if (!currentUser) return { ok: false, error: "Sign in first." }
      const session = state.sessions.find((x) => x.id === sessionId)
      if (!session) return { ok: false, error: "Session not found." }
      const ended = session.endedManuallyAt || new Date(session.endsAt).getTime() < Date.now()
      if (ended) return { ok: false, error: "This session has ended. Attendance is locked." }
      if (new Date(session.startsAt).getTime() > Date.now() + 15 * 60 * 1000) {
        return { ok: false, error: "The session has not started yet." }
      }
      update((s) => {
        const existing = s.attendance.find((a) => a.sessionId === sessionId && a.studentId === currentUser.id)
        const attendance = existing
          ? s.attendance.map((a) => (a.id === existing.id ? { ...a, status: "present" as const, joinedAt: a.joinedAt ?? nowIso() } : a))
          : [...s.attendance, { id: uid("att"), sessionId, studentId: currentUser.id, status: "present" as const, joinedAt: nowIso() }]
        return { ...s, attendance }
      })
      return { ok: true, data: session.zoomLink }
    },

    submitExcuse(sessionId, excuse) {
      if (!currentUser) return { ok: false, error: "Sign in first." }
      const session = state.sessions.find((x) => x.id === sessionId)
      if (!session) return { ok: false, error: "Session not found." }
      const ended = session.endedManuallyAt || new Date(session.endsAt).getTime() < Date.now()
      if (ended) return { ok: false, error: "The excuse window closed when the session ended." }
      if (excuse.trim().length < 10) return { ok: false, error: "Please explain your absence in a little more detail." }
      update((s) => {
        const existing = s.attendance.find((a) => a.sessionId === sessionId && a.studentId === currentUser.id)
        const attendance = existing
          ? s.attendance.map((a) => (a.id === existing.id ? { ...a, excuse: excuse.trim(), excuseAt: nowIso() } : a))
          : [
              ...s.attendance,
              { id: uid("att"), sessionId, studentId: currentUser.id, status: "absent" as const, excuse: excuse.trim(), excuseAt: nowIso() },
            ]
        return { ...s, attendance }
      })
      return { ok: true, data: undefined }
    },

    saveCourse(input) {
      const existing = input.id ? state.courses.find((c) => c.id === input.id) : undefined
      const course: Course = {
        id: existing?.id ?? uid("c"),
        slug: existing?.slug ?? (input.title ?? "course").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        title: input.title ?? existing?.title ?? "Untitled course",
        type: input.type ?? existing?.type ?? "basics",
        tagline: input.tagline ?? existing?.tagline ?? "",
        description: input.description ?? existing?.description ?? "",
        priceEGP: input.priceEGP ?? existing?.priceEGP ?? 0,
        batchLabel: input.batchLabel ?? existing?.batchLabel ?? "",
        prerequisiteCourseId: input.prerequisiteCourseId ?? existing?.prerequisiteCourseId,
        whatsappLink: input.whatsappLink ?? existing?.whatsappLink ?? "",
        status: input.status ?? existing?.status ?? "open",
        startDate: input.startDate ?? existing?.startDate ?? nowIso(),
        endDate: input.endDate ?? existing?.endDate ?? nowIso(),
        highlights: input.highlights ?? existing?.highlights ?? [],
        coverImage: input.coverImage ?? existing?.coverImage ?? "/images/course-basics.jpg",
        bookTitle: input.bookTitle ?? existing?.bookTitle,
        bookPages: input.bookPages ?? existing?.bookPages,
        bookUrl: input.bookUrl ?? existing?.bookUrl,
        createdAt: existing?.createdAt ?? nowIso(),
      }
      update((s) =>
        audit(
          {
            ...s,
            courses: existing ? s.courses.map((c) => (c.id === course.id ? course : c)) : [...s.courses, course],
          },
          existing ? "Updated course" : "Created course",
          course.title
        )
      )
      return { ok: true, data: course }
    },

    saveChapter(input) {
      const existing = input.id ? state.chapters.find((c) => c.id === input.id) : undefined
      const siblings = state.chapters.filter((c) => c.courseId === input.courseId)
      const chapter: Chapter = {
        id: existing?.id ?? uid("ch"),
        courseId: input.courseId,
        title: input.title ?? existing?.title ?? "Untitled chapter",
        description: input.description ?? existing?.description ?? "",
        order: input.order ?? existing?.order ?? siblings.length + 1,
        published: input.published ?? existing?.published ?? false,
      }
      update((s) =>
        audit(
          {
            ...s,
            chapters: existing ? s.chapters.map((c) => (c.id === chapter.id ? chapter : c)) : [...s.chapters, chapter],
          },
          existing ? (existing.published !== chapter.published ? (chapter.published ? "Published chapter" : "Unpublished chapter") : "Updated chapter") : "Created chapter",
          chapter.title
        )
      )
      return { ok: true, data: chapter }
    },

    saveLesson(input) {
      const existing = input.id ? state.lessons.find((l) => l.id === input.id) : undefined
      const siblings = state.lessons.filter((l) => l.chapterId === input.chapterId)
      const lesson: Lesson = {
        id: existing?.id ?? uid("l"),
        chapterId: input.chapterId,
        courseId: input.courseId,
        title: input.title ?? existing?.title ?? "Untitled lesson",
        description: input.description ?? existing?.description ?? "",
        order: input.order ?? existing?.order ?? siblings.length + 1,
        published: input.published ?? existing?.published ?? false,
        durationMin: input.durationMin ?? existing?.durationMin ?? 45,
        videoUrl: input.videoUrl ?? existing?.videoUrl,
        pdfUrl: input.pdfUrl ?? existing?.pdfUrl,
        pdfPages: input.pdfPages ?? existing?.pdfPages,
      }
      update((s) =>
        audit(
          {
            ...s,
            lessons: existing ? s.lessons.map((l) => (l.id === lesson.id ? lesson : l)) : [...s.lessons, lesson],
          },
          existing ? (existing.published !== lesson.published ? (lesson.published ? "Published lesson" : "Unpublished lesson") : "Updated lesson") : "Created lesson",
          lesson.title
        )
      )
      return { ok: true, data: lesson }
    },

    deleteChapter(id) {
      update((s) => {
        const ch = s.chapters.find((c) => c.id === id)
        const lessonIds = s.lessons.filter((l) => l.chapterId === id).map((l) => l.id)
        return audit(
          {
            ...s,
            chapters: s.chapters.filter((c) => c.id !== id),
            lessons: s.lessons.filter((l) => l.chapterId !== id),
            assignments: s.assignments.filter((a) => a.chapterId !== id),
            progress: s.progress.filter((p) => !lessonIds.includes(p.lessonId)),
          },
          "Deleted chapter",
          ch?.title ?? id
        )
      })
    },

    deleteLesson(id) {
      update((s) => {
        const l = s.lessons.find((x) => x.id === id)
        return audit(
          {
            ...s,
            lessons: s.lessons.filter((x) => x.id !== id),
            assignments: s.assignments.filter((a) => a.lessonId !== id),
            progress: s.progress.filter((p) => p.lessonId !== id),
          },
          "Deleted lesson",
          l?.title ?? id
        )
      })
    },

    saveAssignment(input) {
      const existing = input.id ? state.assignments.find((a) => a.id === input.id) : undefined
      const assignment: Assignment = {
        id: existing?.id ?? uid("a"),
        courseId: input.courseId,
        chapterId: input.chapterId,
        lessonId: input.lessonId ?? existing?.lessonId,
        kind: input.kind ?? existing?.kind ?? "homework",
        title: input.title ?? existing?.title ?? "Untitled assignment",
        deadline: input.deadline ?? existing?.deadline ?? new Date(Date.now() + 7 * 864e5).toISOString(),
        totalPoints: input.totalPoints ?? existing?.totalPoints ?? 10,
        maxAttempts: input.maxAttempts ?? existing?.maxAttempts ?? 1,
        showCorrectAnswers: input.showCorrectAnswers ?? existing?.showCorrectAnswers ?? true,
        published: input.published ?? existing?.published ?? false,
      }
      update((s) =>
        audit(
          {
            ...s,
            assignments: existing ? s.assignments.map((a) => (a.id === assignment.id ? assignment : a)) : [...s.assignments, assignment],
          },
          existing ? "Updated assignment" : "Created assignment",
          assignment.title
        )
      )
      return { ok: true, data: assignment }
    },

    deleteAssignment(id) {
      update((s) => {
        const a = s.assignments.find((x) => x.id === id)
        return audit(
          {
            ...s,
            assignments: s.assignments.filter((x) => x.id !== id),
            questions: s.questions.filter((q) => q.assignmentId !== id),
            submissions: s.submissions.filter((x) => x.assignmentId !== id),
          },
          "Deleted assignment",
          a?.title ?? id
        )
      })
    },

    saveQuestion(input) {
      const existing = input.id ? state.questions.find((q) => q.id === input.id) : undefined
      const siblings = state.questions.filter((q) => q.assignmentId === input.assignmentId)
      const question: Question = {
        id: existing?.id ?? uid("q"),
        assignmentId: input.assignmentId,
        text: input.text ?? existing?.text ?? "",
        options: input.options ?? existing?.options ?? ["", "", "", ""],
        correctIndex: input.correctIndex ?? existing?.correctIndex ?? 0,
        order: input.order ?? existing?.order ?? siblings.length + 1,
      }
      update((s) => ({
        ...s,
        questions: existing ? s.questions.map((q) => (q.id === question.id ? question : q)) : [...s.questions, question],
      }))
      return { ok: true, data: question }
    },

    deleteQuestion(id) {
      update((s) => ({ ...s, questions: s.questions.filter((q) => q.id !== id) }))
    },

    saveSession(input) {
      const existing = input.id ? state.sessions.find((x) => x.id === input.id) : undefined
      const session: LiveSession = {
        id: existing?.id ?? uid("ls"),
        courseId: input.courseId,
        chapterId: input.chapterId ?? existing?.chapterId,
        title: input.title ?? existing?.title ?? "Live session",
        zoomLink: input.zoomLink ?? existing?.zoomLink ?? "",
        startsAt: input.startsAt ?? existing?.startsAt ?? nowIso(),
        endsAt: input.endsAt ?? existing?.endsAt ?? new Date(Date.now() + 90 * 60000).toISOString(),
        endedManuallyAt: existing?.endedManuallyAt,
        createdBy: existing?.createdBy ?? state.currentUserId ?? "system",
      }
      update((s) =>
        audit(
          {
            ...s,
            sessions: existing ? s.sessions.map((x) => (x.id === session.id ? session : x)) : [...s.sessions, session],
          },
          existing ? "Updated session" : "Scheduled session",
          session.title
        )
      )
      return { ok: true, data: session }
    },

    endSession(sessionId) {
      const session = state.sessions.find((x) => x.id === sessionId)
      if (!session) return { ok: false, error: "Session not found." }
      update((s) =>
        audit(
          {
            ...s,
            sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, endedManuallyAt: nowIso(), endsAt: nowIso() } : x)),
          },
          "Ended session",
          session.title
        )
      )
      return { ok: true, data: undefined }
    },

    deleteSession(sessionId) {
      update((s) => {
        const x = s.sessions.find((y) => y.id === sessionId)
        return audit(
          {
            ...s,
            sessions: s.sessions.filter((y) => y.id !== sessionId),
            attendance: s.attendance.filter((a) => a.sessionId !== sessionId),
          },
          "Deleted session",
          x?.title ?? sessionId
        )
      })
    },

    generateAttendanceReport(sessionId) {
      const session = state.sessions.find((x) => x.id === sessionId)
      if (!session) return { ok: false, error: "Session not found." }
      const ended = session.endedManuallyAt || new Date(session.endsAt).getTime() < Date.now()
      if (!ended) return { ok: false, error: "Reports can only be generated after the session ends." }
      const students = state.enrollments
        .filter((e) => e.courseId === session.courseId && e.status === "paid")
        .map((e) => state.profiles.find((p) => p.id === e.studentId))
        .filter(Boolean) as Profile[]
      const rows = students.map((p) => {
        const a = state.attendance.find((x) => x.sessionId === sessionId && x.studentId === p.id)
        const status =
          a?.status === "present" ? "Present" : a?.excuse ? "Absent — excuse given" : "Absent — excuse not given"
        return { Student: p.fullName, WhatsApp: p.whatsapp, Status: status, Excuse: a?.excuse ?? "—" }
      })
      const report: GeneratedReport = {
        id: uid("rp"),
        courseId: session.courseId,
        kind: "attendance",
        title: `Attendance — ${session.title}`,
        createdAt: nowIso(),
        createdBy: state.currentUserId ?? "system",
        sizeKB: 60 + rows.length * 2,
        sessionId,
        columns: ["Student", "WhatsApp", "Status", "Excuse"],
        rows,
      }
      update((s) => audit({ ...s, reports: [report, ...s.reports] }, "Generated report", report.title))
      return { ok: true, data: report }
    },

    generateGradesReport(assignmentId) {
      const assignment = state.assignments.find((a) => a.id === assignmentId)
      if (!assignment) return { ok: false, error: "Assignment not found." }
      if (new Date(assignment.deadline).getTime() > Date.now()) {
        return { ok: false, error: "Reports can only be generated after the deadline passes." }
      }
      const students = state.enrollments
        .filter((e) => e.courseId === assignment.courseId && e.status === "paid")
        .map((e) => state.profiles.find((p) => p.id === e.studentId))
        .filter(Boolean) as Profile[]
      const rows = students.map((p) => {
        const subs = state.submissions.filter((x) => x.assignmentId === assignmentId && x.studentId === p.id)
        const best = subs.sort((a, b) => b.score - a.score)[0]
        return {
          Student: p.fullName,
          Score: best ? best.score : "Missing",
          "Out of": assignment.totalPoints,
          Submitted: best ? new Date(best.submittedAt).toLocaleDateString("en-GB") : "—",
        }
      })
      const report: GeneratedReport = {
        id: uid("rp"),
        courseId: assignment.courseId,
        kind: "grades",
        title: `Grades — ${assignment.title}`,
        createdAt: nowIso(),
        createdBy: state.currentUserId ?? "system",
        sizeKB: 50 + rows.length * 2,
        assignmentId,
        columns: ["Student", "Score", "Out of", "Submitted"],
        rows,
      }
      update((s) => audit({ ...s, reports: [report, ...s.reports] }, "Generated report", report.title))
      return { ok: true, data: report }
    },

    createCoAdmin({ fullName, email, password, whatsapp, scopes }) {
      if (state.profiles.some((p) => p.email.toLowerCase() === email.trim().toLowerCase())) {
        return { ok: false, error: "An account with this email already exists." }
      }
      const profile: Profile = {
        id: uid("u"),
        role: "co_admin",
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        whatsapp,
        password,
        status: "active",
        createdAt: nowIso(),
        scopes,
        avatarSeed: fullName
          .trim()
          .split(/\s+/)
          .map((p) => p[0]?.toUpperCase() ?? "")
          .join("")
          .slice(0, 2),
      }
      update((s) => audit({ ...s, profiles: [...s.profiles, profile] }, "Created co-admin", profile.fullName))
      return { ok: true, data: profile }
    },

    updateScopes(userId, scopes) {
      update((s) => {
        const p = s.profiles.find((x) => x.id === userId)
        return audit(
          { ...s, profiles: s.profiles.map((x) => (x.id === userId ? { ...x, scopes } : x)) },
          "Updated permissions",
          p?.fullName ?? userId
        )
      })
    },

    setUserStatus(userId, status) {
      update((s) => {
        const p = s.profiles.find((x) => x.id === userId)
        return audit(
          { ...s, profiles: s.profiles.map((x) => (x.id === userId ? { ...x, status } : x)) },
          status === "suspended" ? "Suspended account" : "Reactivated account",
          p?.fullName ?? userId
        )
      })
    },

    deleteUsers(userIds) {
      update((s) => {
        const names = s.profiles.filter((p) => userIds.includes(p.id)).map((p) => p.fullName)
        return audit(
          {
            ...s,
            profiles: s.profiles.filter((p) => !userIds.includes(p.id)),
            enrollments: s.enrollments.filter((e) => !userIds.includes(e.studentId)),
            submissions: s.submissions.filter((x) => !userIds.includes(x.studentId)),
            attendance: s.attendance.filter((a) => !userIds.includes(a.studentId)),
            progress: s.progress.filter((p) => !userIds.includes(p.studentId)),
            qa: s.qa.filter((q) => !userIds.includes(q.studentId)),
          },
          userIds.length > 1 ? `Removed ${userIds.length} accounts` : "Removed account",
          names.slice(0, 3).join(", ") + (names.length > 3 ? ` +${names.length - 3}` : "")
        )
      })
    },

    forceDeviceReset(userId) {
      update((s) => {
        const p = s.profiles.find((x) => x.id === userId)
        return audit(
          {
            ...s,
            profiles: s.profiles.map((x) => (x.id === userId ? { ...x, deviceId: undefined, deviceLabel: undefined } : x)),
          },
          "Forced device reset",
          p?.fullName ?? userId
        )
      })
    },

    answerQuestion(qaId, answer) {
      update((s) =>
        audit(
          {
            ...s,
            qa: s.qa.map((q) =>
              q.id === qaId ? { ...q, answer: answer.trim(), answeredBy: s.currentUserId ?? undefined, answeredAt: nowIso(), approved: true } : q
            ),
          },
          "Answered question",
          s.qa.find((q) => q.id === qaId)?.question.slice(0, 40) ?? qaId
        )
      )
    },

    setQaApproved(qaId, approved) {
      update((s) => ({ ...s, qa: s.qa.map((q) => (q.id === qaId ? { ...q, approved } : q)) }))
    },

    postAnnouncement(courseId, title, body) {
      if (!title.trim() || !body.trim()) return { ok: false, error: "Title and message are required." }
      update((s) =>
        audit(
          {
            ...s,
            announcements: [
              { id: uid("an"), courseId, title: title.trim(), body: body.trim(), createdAt: nowIso(), authorId: s.currentUserId ?? "system" },
              ...s.announcements,
            ],
          },
          "Posted announcement",
          title.trim()
        )
      )
      return { ok: true, data: undefined }
    },

    endOfCourseCleanup(courseId) {
      const course = state.courses.find((c) => c.id === courseId)
      if (!course) return { ok: false, error: "Course not found." }
      const enrolled = state.enrollments.filter((e) => e.courseId === courseId && e.status === "paid")
      const studentIds = enrolled.map((e) => e.studentId)
      const assignments = state.assignments.filter((a) => a.courseId === courseId)
      const sessions = state.sessions.filter((x) => x.courseId === courseId)
      const columns = ["Student", "WhatsApp", "Grades total", "Out of", "Sessions attended", "Sessions total"]
      const rows = studentIds.map((sid) => {
        const p = state.profiles.find((x) => x.id === sid)!
        const total = assignments.reduce((acc, a) => {
          const best = state.submissions.filter((x) => x.assignmentId === a.id && x.studentId === sid).sort((x, y) => y.score - x.score)[0]
          return acc + (best?.score ?? 0)
        }, 0)
        const outOf = assignments.reduce((acc, a) => acc + a.totalPoints, 0)
        const attended = state.attendance.filter((a) => a.studentId === sid && a.status === "present" && sessions.some((x) => x.id === a.sessionId)).length
        return {
          Student: p?.fullName ?? sid,
          WhatsApp: p?.whatsapp ?? "",
          "Grades total": total,
          "Out of": outOf,
          "Sessions attended": attended,
          "Sessions total": sessions.length,
        }
      })
      const report: GeneratedReport = {
        id: uid("rp"),
        courseId,
        kind: "archive",
        title: `Final archive — ${course.batchLabel}`,
        createdAt: nowIso(),
        createdBy: state.currentUserId ?? "system",
        sizeKB: 120 + rows.length * 3,
        columns,
        rows,
      }
      update((s) =>
        audit(
          {
            ...s,
            reports: [report, ...s.reports],
            courses: s.courses.map((c) => (c.id === courseId ? { ...c, status: "archived" } : c)),
            profiles: s.profiles.filter((p) => !(p.role === "student" && studentIds.includes(p.id))),
            enrollments: s.enrollments.filter((e) => e.courseId !== courseId),
            submissions: s.submissions.filter((x) => !studentIds.includes(x.studentId)),
            attendance: s.attendance.filter((a) => !studentIds.includes(a.studentId)),
            progress: s.progress.filter((p) => !studentIds.includes(p.studentId)),
            qa: s.qa.filter((q) => !studentIds.includes(q.studentId)),
          },
          "End-of-course cleanup",
          `${course.batchLabel} · ${studentIds.length} accounts archived`
        )
      )
      return { ok: true, data: report }
    },

    resetDemo() {
      const fresh = createSeed(Date.now(), state.deviceId)
      setState(fresh)
    },
  }

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
