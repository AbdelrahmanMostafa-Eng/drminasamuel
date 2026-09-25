import type { AppState, Assignment, Course, LiveSession, Profile } from "./types"

export type SessionStatus = "upcoming" | "live" | "ended"

export function sessionStatus(session: LiveSession, now = Date.now()): SessionStatus {
  if (session.endedManuallyAt) return "ended"
  const start = new Date(session.startsAt).getTime()
  const end = new Date(session.endsAt).getTime()
  if (now < start) return "upcoming"
  if (now > end) return "ended"
  return "live"
}

export function isEnrolled(state: AppState, studentId: string | undefined, courseId: string) {
  if (!studentId) return false
  return state.enrollments.some((e) => e.studentId === studentId && e.courseId === courseId && e.status === "paid")
}

export function hasPrerequisite(state: AppState, studentId: string | undefined, course: Course) {
  if (!course.prerequisiteCourseId) return true
  return isEnrolled(state, studentId, course.prerequisiteCourseId)
}

export function enrolledCourses(state: AppState, studentId: string) {
  return state.enrollments
    .filter((e) => e.studentId === studentId && e.status === "paid")
    .map((e) => state.courses.find((c) => c.id === e.courseId))
    .filter(Boolean) as Course[]
}

export function courseStudents(state: AppState, courseId: string): Profile[] {
  return state.enrollments
    .filter((e) => e.courseId === courseId && e.status === "paid")
    .map((e) => state.profiles.find((p) => p.id === e.studentId))
    .filter(Boolean) as Profile[]
}

export function publishedChapters(state: AppState, courseId: string, includeDrafts = false) {
  return state.chapters
    .filter((c) => c.courseId === courseId && (includeDrafts || c.published))
    .sort((a, b) => a.order - b.order)
}

export function chapterLessons(state: AppState, chapterId: string, includeDrafts = false) {
  return state.lessons
    .filter((l) => l.chapterId === chapterId && (includeDrafts || l.published))
    .sort((a, b) => a.order - b.order)
}

export function courseProgress(state: AppState, studentId: string, courseId: string) {
  const lessons = state.lessons.filter((l) => l.courseId === courseId && l.published)
  const assignments = state.assignments.filter((a) => a.courseId === courseId && a.published)
  const watched = lessons.filter((l) => state.progress.some((p) => p.studentId === studentId && p.lessonId === l.id)).length
  const done = assignments.filter((a) => state.submissions.some((s) => s.studentId === studentId && s.assignmentId === a.id)).length
  const total = lessons.length + assignments.length
  const completed = watched + done
  return {
    lessonsWatched: watched,
    lessonsTotal: lessons.length,
    assignmentsDone: done,
    assignmentsTotal: assignments.length,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  }
}

export function bestSubmission(state: AppState, studentId: string, assignmentId: string) {
  return state.submissions
    .filter((s) => s.studentId === studentId && s.assignmentId === assignmentId)
    .sort((a, b) => b.score - a.score)[0]
}

export function attemptsUsed(state: AppState, studentId: string, assignmentId: string) {
  return state.submissions.filter((s) => s.studentId === studentId && s.assignmentId === assignmentId).length
}

export type AssignmentState = "open" | "locked" | "submitted" | "missing" | "draft"

export function assignmentState(state: AppState, studentId: string, a: Assignment, now = Date.now()): AssignmentState {
  if (!a.published) return "draft"
  const submitted = attemptsUsed(state, studentId, a.id) > 0
  const past = new Date(a.deadline).getTime() < now
  if (submitted) return "submitted"
  if (past) return "missing"
  return "open"
}

export function gradeSummary(state: AppState, studentId: string, courseId: string) {
  const assignments = state.assignments.filter((a) => a.courseId === courseId && a.published)
  let earned = 0
  let possible = 0
  let closed = 0
  for (const a of assignments) {
    const best = bestSubmission(state, studentId, a.id)
    const isPast = new Date(a.deadline).getTime() < Date.now()
    if (best) {
      earned += best.score
      possible += a.totalPoints
    } else if (isPast) {
      possible += a.totalPoints
      closed++
    }
  }
  return { earned, possible, missing: closed, percent: possible ? Math.round((earned / possible) * 100) : 0 }
}

export function attendanceSummary(state: AppState, studentId: string, courseId: string) {
  const ended = state.sessions.filter((s) => s.courseId === courseId && sessionStatus(s) === "ended")
  const present = ended.filter((s) => state.attendance.some((a) => a.sessionId === s.id && a.studentId === studentId && a.status === "present")).length
  return { present, total: ended.length, percent: ended.length ? Math.round((present / ended.length) * 100) : 0 }
}

export function courseRevenue(state: AppState, courseId?: string) {
  return state.transactions
    .filter((t) => t.status === "success" && (!courseId || t.courseId === courseId))
    .reduce((acc, t) => acc + t.amount, 0)
}

export function weakTopics(state: AppState, courseId: string) {
  const assignments = state.assignments.filter((a) => a.courseId === courseId)
  const rows = state.questions
    .filter((q) => assignments.some((a) => a.id === q.assignmentId))
    .map((q) => {
      const subs = state.submissions.filter((s) => s.assignmentId === q.assignmentId)
      const attempts = subs.length
      const wrong = subs.filter((s) => s.answers[q.order - 1] !== q.correctIndex).length
      const assignment = assignments.find((a) => a.id === q.assignmentId)!
      const chapter = state.chapters.find((c) => c.id === assignment.chapterId)
      return {
        questionId: q.id,
        text: q.text,
        chapter: chapter?.title ?? "",
        assignment: assignment.title,
        attempts,
        wrong,
        wrongRate: attempts ? wrong / attempts : 0,
      }
    })
    .filter((r) => r.attempts >= 3)
    .sort((a, b) => b.wrongRate - a.wrongRate)
  return rows
}

export function canAccessCourseContent(state: AppState, user: Profile | null, courseId: string) {
  if (!user) return false
  if (user.role !== "student") return true
  return isEnrolled(state, user.id, courseId)
}

export function hasScope(user: Profile | null, scope: Profile["scopes"][number]) {
  if (!user) return false
  if (user.role === "master_admin") return true
  return user.role === "co_admin" && user.scopes.includes(scope)
}

export function certificateEligible(state: AppState, studentId: string, courseId: string) {
  const assignments = state.assignments.filter((a) => a.courseId === courseId && a.published)
  if (assignments.length === 0) return { eligible: false, passed: 0, total: 0 }
  const passed = assignments.filter((a) => {
    const best = bestSubmission(state, studentId, a.id)
    return best && best.score / a.totalPoints >= 0.5
  }).length
  return { eligible: passed === assignments.length, passed, total: assignments.length }
}
