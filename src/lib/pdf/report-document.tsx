import path from "node:path";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatInTimeZone } from "date-fns-tz";
import type { AttendanceReportData, GradesReportData, CourseSummaryData } from "../reports";

const phone = (p: string | null) => {
  if (!p) return "—";
  const m = p.match(/^\+20(1\d)(\d{4})(\d{4})$/);
  return m ? `+20 ${m[1]} ${m[2]} ${m[3]}` : p;
};

const TZ = "Africa/Cairo";
const f = (d: string | null, p = "d MMM yyyy, h:mm a") => (d ? formatInTimeZone(new Date(d), TZ, p) : "—");

const C = {
  brand: "#1f607c",
  brandDark: "#123b4d",
  accent: "#f08a1c",
  ink: "#0f1d26",
  muted: "#5b6b76",
  line: "#e3e9ee",
  zebra: "#f6f9fb",
  green: "#0f8a5f",
  greenBg: "#e3f6ee",
  amber: "#a45d00",
  amberBg: "#fff1dc",
  red: "#c0362c",
  redBg: "#fde7e5",
  grayBg: "#eef1f4",
};

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 46, paddingHorizontal: 32, fontFamily: "Helvetica", fontSize: 9, color: C.ink },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 34, height: 32, marginRight: 10 },
  brandName: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.brandDark },
  brandSub: { fontSize: 8, color: C.muted, marginTop: 2 },
  metaRight: { alignItems: "flex-end" },
  metaText: { fontSize: 8, color: C.muted, marginBottom: 2 },
  band: { backgroundColor: C.brand, borderRadius: 8, padding: 14, marginBottom: 12 },
  bandKicker: { color: "#ffd7a8", fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.2, marginBottom: 4 },
  bandTitle: { color: "#ffffff", fontSize: 16, fontFamily: "Helvetica-Bold" },
  bandSub: { color: "#d3e7ef", fontSize: 9, marginTop: 4 },
  stats: { flexDirection: "row", marginBottom: 14 },
  stat: { flexGrow: 1, flexBasis: 0, borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 8, marginRight: 6 },
  statLast: { marginRight: 0 },
  statValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  statLabel: { fontSize: 7.5, color: C.muted, marginTop: 2 },
  table: { borderWidth: 1, borderColor: C.line, borderRadius: 6 },
  thead: { flexDirection: "row", backgroundColor: C.brandDark, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  th: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8, paddingVertical: 7, paddingHorizontal: 6 },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line, alignItems: "center" },
  td: { paddingVertical: 6, paddingHorizontal: 6, fontSize: 8.5 },
  pill: { borderRadius: 8, paddingVertical: 2.5, paddingHorizontal: 6, fontSize: 7.5, fontFamily: "Helvetica-Bold", alignSelf: "flex-start" },
  small: { fontSize: 7, color: C.muted, marginTop: 2 },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.muted },
  legend: { flexDirection: "row", marginTop: 10, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
});

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <Text style={[s.pill, { color, backgroundColor: bg }]}>{label}</Text>;
}

function Shell({
  children,
  kicker,
  title,
  sub,
  courseTitle,
  generatedAt,
  generatedBy,
  landscape,
}: {
  children: React.ReactNode;
  kicker: string;
  title: string;
  sub: string;
  courseTitle: string;
  generatedAt: string;
  generatedBy: string;
  landscape?: boolean;
}) {
  const logo = path.join(process.cwd(), "public/brand/logo-mark.png");
  return (
    <Document title={title} author="Bioacademy" creator="Bioacademy">
      <Page size="A4" orientation={landscape ? "landscape" : "portrait"} style={s.page}>
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logo} style={s.logo} />
            <View>
              <Text style={s.brandName}>Bioacademy</Text>
              <Text style={s.brandSub}>Dr. Mina Samuel · ACT2 & EST Biology</Text>
            </View>
          </View>
          <View style={s.metaRight}>
            <Text style={s.metaText}>{courseTitle}</Text>
            <Text style={s.metaText}>Generated {f(generatedAt)}</Text>
            <Text style={s.metaText}>By {generatedBy}</Text>
          </View>
        </View>
        <View style={s.band}>
          <Text style={s.bandKicker}>{kicker.toUpperCase()}</Text>
          <Text style={s.bandTitle}>{title}</Text>
          <Text style={s.bandSub}>{sub}</Text>
        </View>
        {children}
        <View style={s.footer} fixed>
          <Text>Bioacademy · Confidential — for teacher & assistants only</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

function Stats({ items }: { items: { label: string; value: string | number; color?: string }[] }) {
  return (
    <View style={s.stats}>
      {items.map((it, i) => (
        <View key={it.label} style={i === items.length - 1 ? [s.stat, s.statLast] : s.stat}>
          <Text style={[s.statValue, { color: it.color ?? C.ink }]}>{it.value}</Text>
          <Text style={s.statLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const latin = (t: string) => /^[\x00-\x7F -ɏ\s]*$/.test(t);

export function AttendancePdf({ data, meta }: { data: AttendanceReportData; meta: { courseTitle: string; generatedAt: string; generatedBy: string } }) {
  const cols = [22, 150, 92, 70, 110, 70];
  return (
    <Shell
      kicker="Attendance report"
      title={data.session.title}
      sub={`${f(data.session.startsAt, "EEEE d MMMM yyyy · h:mm a")} – ${f(data.session.endsAt, "h:mm a")} (Cairo time)`}
      {...meta}
    >
      <Stats
        items={[
          { label: "Students", value: data.summary.total },
          { label: "Present", value: data.summary.present, color: C.green },
          { label: "Absent — Excuse Given", value: data.summary.excused, color: C.amber },
          { label: "Absent — Excuse NOT Given", value: data.summary.unexcused, color: C.red },
          { label: "Attendance rate", value: `${data.summary.total ? Math.round((data.summary.present / data.summary.total) * 100) : 0}%`, color: C.brand },
        ]}
      />
      <View style={s.table}>
        <View style={s.thead} fixed>
          {["#", "Student name", "WhatsApp", "Status", "Excuse", "Joined at"].map((h, i) => (
            <Text key={h} style={[s.th, { width: cols[i] }, i === 4 ? { flexGrow: 1 } : {}]}>
              {h}
            </Text>
          ))}
        </View>
        {data.rows.map((r, i) => (
          <View key={i} style={[s.tr, i % 2 ? { backgroundColor: C.zebra } : {}]} wrap={false}>
            <Text style={[s.td, { width: cols[0], color: C.muted }]}>{i + 1}</Text>
            <Text style={[s.td, { width: cols[1], fontFamily: "Helvetica-Bold" }]}>{r.name}</Text>
            <Text style={[s.td, { width: cols[2] }]}>{phone(r.whatsapp)}</Text>
            <View style={[s.td, { width: cols[3] }]}>
              {r.status === "PRESENT" ? (
                <Pill label={r.manual ? "Present*" : "Present"} color={C.green} bg={C.greenBg} />
              ) : r.status === "ABSENT" ? (
                <Pill label={r.manual ? "Absent*" : "Absent"} color={C.red} bg={C.redBg} />
              ) : (
                <Pill label="Not enrolled yet" color={C.muted} bg={C.grayBg} />
              )}
            </View>
            <View style={[s.td, { width: cols[4], flexGrow: 1 }]}>
              {r.excuse === "GIVEN" ? (
                <>
                  <Pill label="Excuse Given" color={C.amber} bg={C.amberBg} />
                  {r.excuseText ? (
                    <Text style={s.small}>{latin(r.excuseText) ? `“${r.excuseText.slice(0, 140)}${r.excuseText.length > 140 ? "…" : ""}”` : "(written in Arabic — see dashboard)"}</Text>
                  ) : null}
                </>
              ) : r.excuse === "NOT_GIVEN" ? (
                <Pill label="Excuse NOT Given" color={C.red} bg={C.redBg} />
              ) : (
                <Text style={{ color: C.muted }}>—</Text>
              )}
            </View>
            <Text style={[s.td, { width: cols[5], color: C.muted }]}>{r.joinedAt ? f(r.joinedAt, "h:mm a") : "—"}</Text>
          </View>
        ))}
        {data.rows.length === 0 && <Text style={[s.td, { color: C.muted, padding: 12 }]}>No enrolled students.</Text>}
      </View>
      <View style={s.legend}>
        <Text style={{ fontSize: 7.5, color: C.muted }}>
          Present = clicked “Join session” on Bioacademy before the session ended. * = adjusted manually by staff.
        </Text>
      </View>
    </Shell>
  );
}

export function GradesPdf({ data, meta }: { data: GradesReportData; meta: { courseTitle: string; generatedAt: string; generatedBy: string } }) {
  const cols = [22, 150, 92, 70, 70, 46, 90];
  return (
    <Shell
      kicker={data.assessment.type === "QUIZ" ? "Quiz grades report" : "Homework grades report"}
      title={data.assessment.title}
      sub={`${data.assessment.parent} · ${data.assessment.questions} questions · ${data.assessment.totalPoints} points · Deadline ${f(data.assessment.dueAt)}`}
      {...meta}
    >
      <Stats
        items={[
          { label: "Students", value: data.summary.total },
          { label: "Done", value: data.summary.done, color: C.green },
          { label: "Not done (0 / missing)", value: data.summary.notDone, color: C.red },
          { label: "Class average", value: `${data.summary.average}%`, color: C.brand },
          { label: "Highest / lowest", value: `${data.summary.highest}% / ${data.summary.lowest}%` },
        ]}
      />
      <View style={s.table}>
        <View style={s.thead} fixed>
          {["#", "Student name", "WhatsApp", "Status", "Score", "%", "Submitted"].map((h, i) => (
            <Text key={h} style={[s.th, { width: cols[i] }, i === 1 ? { flexGrow: 1 } : {}]}>
              {h}
            </Text>
          ))}
        </View>
        {data.rows.map((r, i) => (
          <View key={i} style={[s.tr, i % 2 ? { backgroundColor: C.zebra } : {}]} wrap={false}>
            <Text style={[s.td, { width: cols[0], color: C.muted }]}>{i + 1}</Text>
            <Text style={[s.td, { width: cols[1], flexGrow: 1, fontFamily: "Helvetica-Bold" }]}>{r.name}</Text>
            <Text style={[s.td, { width: cols[2] }]}>{phone(r.whatsapp)}</Text>
            <View style={[s.td, { width: cols[3] }]}>
              {r.na ? (
                <Pill label="Joined later" color={C.muted} bg={C.grayBg} />
              ) : r.done ? (
                <Pill label="Done" color={C.green} bg={C.greenBg} />
              ) : (
                <Pill label="Not done" color={C.red} bg={C.redBg} />
              )}
            </View>
            <Text style={[s.td, { width: cols[4], fontFamily: "Helvetica-Bold", color: r.done ? C.ink : C.red }]}>
              {r.na ? "—" : r.done ? `${r.score} / ${r.total}` : `0 / ${r.total} (missing)`}
            </Text>
            <Text style={[s.td, { width: cols[5] }]}>{r.na ? "—" : `${r.percent}%`}</Text>
            <Text style={[s.td, { width: cols[6], color: C.muted }]}>{r.submittedAt ? f(r.submittedAt, "d MMM, h:mm a") : "—"}</Text>
          </View>
        ))}
        {data.rows.length === 0 && <Text style={[s.td, { color: C.muted, padding: 12 }]}>No enrolled students.</Text>}
      </View>
      <View style={s.legend}>
        <Text style={{ fontSize: 7.5, color: C.muted }}>
          Students who did not submit before the deadline are recorded as Not done with a grade of 0. Best attempt counted when multiple attempts are allowed.
        </Text>
      </View>
    </Shell>
  );
}

export function CourseSummaryPdf({ data, meta }: { data: CourseSummaryData; meta: { courseTitle: string; generatedAt: string; generatedBy: string } }) {
  const cols = [22, 170, 100, 90, 80, 80, 80, 80];
  const color = (p: number) => (p >= 75 ? C.green : p >= 50 ? C.amber : C.red);
  return (
    <Shell
      landscape
      kicker="Course summary"
      title={data.course.title}
      sub={`${data.course.batchLabel ? data.course.batchLabel + " · " : ""}${data.totals.students} students · ${data.totals.sessions} sessions held · ${data.totals.assessments} graded assessments · ${data.totals.lessons} lessons`}
      {...meta}
    >
      <View style={s.table}>
        <View style={s.thead} fixed>
          {["#", "Student name", "WhatsApp", "Attendance", "Homework avg", "Quiz avg", "Assignments", "Lessons done"].map((h, i) => (
            <Text key={h} style={[s.th, { width: cols[i] }, i === 1 ? { flexGrow: 1 } : {}]}>
              {h}
            </Text>
          ))}
        </View>
        {data.rows.map((r, i) => (
          <View key={i} style={[s.tr, i % 2 ? { backgroundColor: C.zebra } : {}]} wrap={false}>
            <Text style={[s.td, { width: cols[0], color: C.muted }]}>{i + 1}</Text>
            <Text style={[s.td, { width: cols[1], flexGrow: 1, fontFamily: "Helvetica-Bold" }]}>{r.name}</Text>
            <Text style={[s.td, { width: cols[2] }]}>{phone(r.whatsapp)}</Text>
            <Text style={[s.td, { width: cols[3], color: color(r.attendance), fontFamily: "Helvetica-Bold" }]}>
              {r.attendance}% ({r.attended}/{r.sessions})
            </Text>
            <Text style={[s.td, { width: cols[4], color: color(r.homeworkAvg), fontFamily: "Helvetica-Bold" }]}>{r.homeworkAvg}%</Text>
            <Text style={[s.td, { width: cols[5], color: color(r.quizAvg), fontFamily: "Helvetica-Bold" }]}>{r.quizAvg}%</Text>
            <Text style={[s.td, { width: cols[6] }]}>
              {r.done}/{r.assigned}
            </Text>
            <Text style={[s.td, { width: cols[7] }]}>
              {r.lessonsCompleted}/{data.totals.lessons}
            </Text>
          </View>
        ))}
        {data.rows.length === 0 && <Text style={[s.td, { color: C.muted, padding: 12 }]}>No enrolled students.</Text>}
      </View>
    </Shell>
  );
}
