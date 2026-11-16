/**
 * Bioacademy seed.
 *  - Always ensures the master-admin account exists (SEED_MASTER_* env vars).
 *  - Optionally (SEED_SAMPLE_DATA != "false") adds EXAMPLE courses, chapters, lessons, PDFs,
 *    homework, quizzes, live sessions and sample students so the teacher can see how
 *    everything looks. All example data is flagged `isSample` and can be removed in one
 *    click from Admin → Website settings → Example data.
 *
 * Run: npm run db:seed
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

const db = new PrismaClient();
const h = React.createElement;
const rid = () => randomBytes(5).toString("hex");
const DAY = 86400_000;
const now = Date.now();
/** `days` from today at hour:minute Cairo wall-clock time. */
const at = (days: number, hour = 18, minute = 0) => {
  const day = formatInTimeZone(new Date(now + days * DAY), "Africa/Cairo", "yyyy-MM-dd");
  return fromZonedTime(`${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`, "Africa/Cairo");
};

// ── storage (mirrors src/lib/storage.ts without the server-only guard) ──
async function put(key: string, body: Buffer, contentType: string) {
  if ((process.env.STORAGE_DRIVER ?? "local") === "s3") {
    const s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_FORCE_PATH_STYLE,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" },
    });
    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET ?? "bioacademy", Key: key, Body: body, ContentType: contentType }));
    return;
  }
  const file = path.resolve(process.env.LOCAL_STORAGE_DIR ?? "./storage", key);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, body);
}

const pdfStyles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 12, color: "#0f1d26" },
  band: { backgroundColor: "#1f607c", padding: 18, borderRadius: 8, marginBottom: 22 },
  kicker: { color: "#ffd2a3", fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 },
  title: { color: "#ffffff", fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4 },
  h: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1f607c", marginTop: 16, marginBottom: 6 },
  p: { lineHeight: 1.6, marginBottom: 6 },
  li: { flexDirection: "row", marginBottom: 4 },
  dot: { width: 14, color: "#ff8a1a", fontFamily: "Helvetica-Bold" },
  foot: { position: "absolute", bottom: 28, left: 48, right: 48, fontSize: 8, color: "#5b6b76", textAlign: "center" },
});

async function makePdf(kicker: string, title: string, sections: { h: string; points: string[] }[], pages = 1) {
  const doc = h(
    Document,
    null,
    ...Array.from({ length: pages }, (_, pi) =>
      h(
        Page,
        { key: pi, size: "A4", style: pdfStyles.page },
        h(View, { style: pdfStyles.band }, h(Text, { style: pdfStyles.kicker }, kicker.toUpperCase()), h(Text, { style: pdfStyles.title }, pi ? `${title} (cont.)` : title)),
        ...sections.map((s, si) =>
          h(
            View,
            { key: si },
            h(Text, { style: pdfStyles.h }, s.h),
            ...s.points.map((p, i) => h(View, { key: i, style: pdfStyles.li }, h(Text, { style: pdfStyles.dot }, "•"), h(Text, { style: { flex: 1, lineHeight: 1.5 } }, p))),
          ),
        ),
        h(Text, { style: pdfStyles.foot }, "Bioacademy · Dr. Mina Samuel · SAMPLE material — replace with your own PDF"),
      ),
    ),
  );
  return renderToBuffer(doc as unknown as React.ReactElement<React.ComponentProps<typeof Document>>);
}

type Q = { text: string; options: string[]; correct: number; explanation?: string };
const toQuestion = (q: Q, i: number): Omit<Prisma.QuestionCreateManyInput, "assessmentId"> => {
  const opts = q.options.map((t) => ({ id: rid(), text: t }));
  return { text: q.text, options: opts, correctOptionId: opts[q.correct]!.id, explanation: q.explanation ?? null, points: 1, sortOrder: i + 1 };
};

// ── Real biology content (ACT2 / EST level) ──
const CONTENT: { chapter: string; description: string; lessons: { title: string; description: string; notes: { h: string; points: string[] }[]; homework: Q[] }[]; quiz: Q[] }[] = [
  {
    chapter: "Cell Biology",
    description: "The cell as the basic unit of life: organelles, membranes, transport and cell division.",
    lessons: [
      {
        title: "Cell structure & organelles",
        description: "Prokaryotic vs eukaryotic cells and the job of every organelle.",
        notes: [
          { h: "Key ideas", points: ["Prokaryotes lack a nucleus and membrane-bound organelles; eukaryotes have both.", "Mitochondria produce ATP through cellular respiration.", "Ribosomes build proteins; rough ER modifies and ships them; Golgi packages them.", "Plant cells add a cell wall, chloroplasts and a large central vacuole."] },
          { h: "Exam tips", points: ["Questions often compare plant vs animal cells — memorise the three differences.", "Look for keywords: 'site of protein synthesis' = ribosome."] },
        ],
        homework: [
          { text: "Which organelle is the main site of ATP production in eukaryotic cells?", options: ["Nucleus", "Mitochondrion", "Golgi apparatus", "Lysosome"], correct: 1, explanation: "Cellular respiration (Krebs cycle + ETC) happens in the mitochondria." },
          { text: "Which structure is found in prokaryotic cells?", options: ["Nucleus", "Mitochondria", "Ribosomes", "Endoplasmic reticulum"], correct: 2, explanation: "All cells have ribosomes; prokaryotes lack membrane-bound organelles." },
          { text: "Which of the following is found in plant cells but NOT animal cells?", options: ["Cell membrane", "Cell wall", "Ribosome", "Mitochondrion"], correct: 1 },
          { text: "The organelle that packages and modifies proteins for secretion is the:", options: ["Golgi apparatus", "Smooth ER", "Centriole", "Vacuole"], correct: 0 },
        ],
      },
      {
        title: "Cell membrane & transport",
        description: "Fluid mosaic model, diffusion, osmosis and active transport.",
        notes: [{ h: "Key ideas", points: ["The membrane is a phospholipid bilayer with embedded proteins (fluid mosaic).", "Diffusion and osmosis are passive — no ATP needed.", "Active transport moves substances against their gradient using ATP.", "In a hypertonic solution, a cell loses water and shrinks."] }],
        homework: [
          { text: "A red blood cell placed in a hypertonic solution will:", options: ["Swell and burst", "Shrink", "Stay the same", "Divide"], correct: 1, explanation: "Water leaves the cell toward the higher solute concentration." },
          { text: "Which process requires ATP?", options: ["Osmosis", "Simple diffusion", "Facilitated diffusion", "Sodium–potassium pump"], correct: 3 },
          { text: "Osmosis is the diffusion of:", options: ["Glucose", "Water", "Oxygen", "Ions"], correct: 1 },
        ],
      },
      {
        title: "Cell division: mitosis & meiosis",
        description: "Phases of mitosis, meiosis and why they matter for genetics.",
        notes: [{ h: "Key ideas", points: ["Mitosis produces 2 identical diploid cells (growth & repair).", "Meiosis produces 4 genetically different haploid gametes.", "Crossing over in prophase I increases genetic variation.", "Order of mitosis: Prophase → Metaphase → Anaphase → Telophase (PMAT)."] }],
        homework: [
          { text: "During which phase do chromosomes line up at the cell's equator?", options: ["Prophase", "Metaphase", "Anaphase", "Telophase"], correct: 1 },
          { text: "Meiosis produces:", options: ["2 diploid cells", "2 haploid cells", "4 haploid cells", "4 diploid cells"], correct: 2 },
          { text: "Crossing over occurs during:", options: ["Prophase I", "Metaphase II", "Anaphase I", "Telophase II"], correct: 0 },
        ],
      },
    ],
    quiz: [
      { text: "Which organelle contains the cell's genetic material in eukaryotes?", options: ["Nucleus", "Ribosome", "Lysosome", "Vacuole"], correct: 0 },
      { text: "Which transport process moves molecules from low to high concentration?", options: ["Diffusion", "Osmosis", "Active transport", "Facilitated diffusion"], correct: 2 },
      { text: "How many chromosomes are in a human gamete?", options: ["46", "23", "92", "44"], correct: 1 },
      { text: "Which structure gives a plant cell its rigid shape?", options: ["Cell membrane", "Cytoskeleton", "Cell wall", "Chloroplast"], correct: 2 },
      { text: "Sister chromatids separate during:", options: ["Prophase", "Metaphase", "Anaphase", "Interphase"], correct: 2 },
      { text: "Lysosomes contain:", options: ["DNA", "Digestive enzymes", "Chlorophyll", "Ribosomal RNA"], correct: 1 },
    ],
  },
  {
    chapter: "Human Systems",
    description: "How the body's organ systems keep you alive: circulation, respiration and the nervous system.",
    lessons: [
      {
        title: "The circulatory system",
        description: "The heart, blood vessels and the path of blood through the body.",
        notes: [{ h: "Key ideas", points: ["Arteries carry blood away from the heart; veins carry blood toward it.", "The right ventricle pumps blood to the lungs; the left ventricle to the body.", "Capillaries are the site of gas and nutrient exchange.", "The pulmonary vein is the only vein carrying oxygenated blood."] }],
        homework: [
          { text: "Which chamber pumps oxygenated blood to the body?", options: ["Right atrium", "Right ventricle", "Left atrium", "Left ventricle"], correct: 3 },
          { text: "Which vessels carry blood away from the heart?", options: ["Veins", "Arteries", "Capillaries", "Venules"], correct: 1 },
          { text: "Gas exchange between blood and tissues happens in the:", options: ["Arteries", "Veins", "Capillaries", "Aorta"], correct: 2 },
        ],
      },
      {
        title: "The respiratory system",
        description: "Breathing mechanics and gas exchange in the alveoli.",
        notes: [{ h: "Key ideas", points: ["Air path: nose → pharynx → larynx → trachea → bronchi → bronchioles → alveoli.", "The diaphragm contracts (moves down) during inhalation.", "O₂ diffuses from alveoli into blood; CO₂ diffuses out."] }],
        homework: [
          { text: "Gas exchange in the lungs takes place in the:", options: ["Trachea", "Bronchi", "Alveoli", "Larynx"], correct: 2 },
          { text: "During inhalation the diaphragm:", options: ["Relaxes and moves up", "Contracts and moves down", "Does not move", "Contracts and moves up"], correct: 1 },
          { text: "Which gas diffuses from the blood into the alveoli?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct: 2 },
        ],
      },
      {
        title: "The nervous system",
        description: "Neurons, synapses and the central vs peripheral nervous system.",
        notes: [{ h: "Key ideas", points: ["Neurons: dendrites receive, axon transmits, axon terminals release neurotransmitters.", "The CNS = brain + spinal cord; the PNS = all other nerves.", "Myelin sheath speeds up impulse conduction."] }],
        homework: [
          { text: "Which part of a neuron receives signals?", options: ["Axon", "Dendrite", "Myelin sheath", "Axon terminal"], correct: 1 },
          { text: "The central nervous system consists of:", options: ["Brain and spinal cord", "Nerves and ganglia", "Brain only", "Spinal cord and nerves"], correct: 0 },
        ],
      },
    ],
    quiz: [
      { text: "Which blood vessel carries oxygenated blood from the lungs to the heart?", options: ["Pulmonary artery", "Pulmonary vein", "Aorta", "Vena cava"], correct: 1 },
      { text: "Which structure prevents food from entering the trachea?", options: ["Epiglottis", "Larynx", "Uvula", "Diaphragm"], correct: 0 },
      { text: "Neurotransmitters are released at the:", options: ["Dendrite", "Cell body", "Synapse", "Nucleus"], correct: 2 },
      { text: "Which side of the heart pumps blood to the lungs?", options: ["Left", "Right", "Both", "Neither"], correct: 1 },
      { text: "Red blood cells mainly transport oxygen using:", options: ["Plasma", "Hemoglobin", "Platelets", "Antibodies"], correct: 1 },
    ],
  },
  {
    chapter: "Ecology",
    description: "Ecosystems, energy flow, food webs and the cycles that sustain life.",
    lessons: [
      {
        title: "Ecosystems & energy flow",
        description: "Producers, consumers, decomposers and the 10% rule.",
        notes: [{ h: "Key ideas", points: ["Only ~10% of energy passes to the next trophic level.", "Producers (autotrophs) capture energy from sunlight.", "Decomposers recycle nutrients back into the ecosystem."] }],
        homework: [
          { text: "Approximately what percent of energy is passed to the next trophic level?", options: ["1%", "10%", "50%", "90%"], correct: 1 },
          { text: "Organisms that make their own food are called:", options: ["Heterotrophs", "Decomposers", "Autotrophs", "Consumers"], correct: 2 },
        ],
      },
      {
        title: "Biogeochemical cycles",
        description: "The carbon, nitrogen and water cycles.",
        notes: [{ h: "Key ideas", points: ["Nitrogen-fixing bacteria convert N₂ into ammonia.", "Photosynthesis removes CO₂; respiration and combustion release it.", "Transpiration moves water from plants into the atmosphere."] }],
        homework: [
          { text: "Which organisms convert atmospheric nitrogen into a usable form?", options: ["Fungi", "Nitrogen-fixing bacteria", "Plants", "Animals"], correct: 1 },
          { text: "Which process removes carbon dioxide from the atmosphere?", options: ["Respiration", "Combustion", "Photosynthesis", "Decomposition"], correct: 2 },
        ],
      },
    ],
    quiz: [
      { text: "In a food chain, a hawk that eats snakes that eat mice that eat grass is a:", options: ["Primary consumer", "Secondary consumer", "Tertiary consumer", "Producer"], correct: 2 },
      { text: "Which is an abiotic factor?", options: ["Bacteria", "Temperature", "Grass", "Fungi"], correct: 1 },
      { text: "The process by which plants lose water vapor is:", options: ["Condensation", "Transpiration", "Precipitation", "Infiltration"], correct: 1 },
    ],
  },
  {
    chapter: "Genetics",
    description: "Mendelian inheritance, Punnett squares and the central dogma.",
    lessons: [
      {
        title: "Mendelian genetics",
        description: "Dominant & recessive alleles, Punnett squares and ratios.",
        notes: [{ h: "Key ideas", points: ["A monohybrid cross of two heterozygotes (Aa × Aa) gives a 3:1 phenotype ratio.", "Genotype = alleles; phenotype = observable trait.", "Law of segregation: allele pairs separate during gamete formation."] }],
        homework: [
          { text: "Aa × Aa produces what phenotypic ratio (complete dominance)?", options: ["1:1", "3:1", "1:2:1", "9:3:3:1"], correct: 1 },
          { text: "An organism with two identical alleles is:", options: ["Heterozygous", "Homozygous", "Hybrid", "Recessive"], correct: 1 },
        ],
      },
      {
        title: "DNA, RNA & protein synthesis",
        description: "Replication, transcription and translation.",
        notes: [{ h: "Key ideas", points: ["Transcription (DNA → mRNA) happens in the nucleus.", "Translation (mRNA → protein) happens at the ribosome.", "In RNA, uracil replaces thymine."] }],
        homework: [
          { text: "Which base is found in RNA but not DNA?", options: ["Adenine", "Thymine", "Uracil", "Guanine"], correct: 2 },
          { text: "Translation takes place at the:", options: ["Nucleus", "Ribosome", "Golgi", "Mitochondrion"], correct: 1 },
        ],
      },
    ],
    quiz: [
      { text: "The complementary DNA strand for 5'-ATCG-3' is:", options: ["3'-TAGC-5'", "3'-UAGC-5'", "3'-ATCG-5'", "3'-GCTA-5'"], correct: 0 },
      { text: "A codon is made of how many nucleotides?", options: ["1", "2", "3", "4"], correct: 2 },
      { text: "In pea plants, T (tall) is dominant. What fraction of Tt × tt offspring are short?", options: ["0", "1/4", "1/2", "3/4"], correct: 2 },
    ],
  },
];

const ADVANCED = [
  { chapter: "Evolution & Classification", lessons: ["Natural selection & evidence for evolution", "Taxonomy and the six kingdoms"] },
  { chapter: "Advanced Genetics", lessons: ["Non-Mendelian inheritance", "Mutations & genetic disorders"] },
  { chapter: "Plant Biology", lessons: ["Photosynthesis in depth", "Plant hormones & responses"] },
];

const STUDENTS = [
  ["Sara Ahmed Hassan", "+201001234501", "sara.ahmed@example.com", 0.8, 0.85],
  ["Omar Khaled Mostafa", "+201001234502", "omar.khaled@example.com", 0.78, 0.85],
  ["Laila Mahmoud Fathy", "+201001234503", "laila.mahmoud@example.com", 0.88, 0.75],
  ["Youssef Tarek Ali", "+201001234504", "youssef.tarek@example.com", 0.45, 0.5],
  ["Nour Hesham Adel", "+201001234505", "nour.hesham@example.com", 0.66, 0.9],
  ["Karim Wael Ibrahim", "+201001234506", "karim.wael@example.com", 0.55, 0.4],
  ["Malak Sherif Nabil", "+201001234507", "malak.sherif@example.com", 0.97, 1],
  ["Adam Ramy Fouad", "+201001234508", "adam.ramy@example.com", 0.72, 0.7],
] as const;

async function main() {
  const username = (process.env.SEED_MASTER_USERNAME ?? "drmina").toLowerCase();
  const password = process.env.SEED_MASTER_PASSWORD ?? "ChangeMe-2026!";
  const name = process.env.SEED_MASTER_NAME ?? "Dr. Mina Samuel";

  const existing = await db.user.findFirst({ where: { role: "MASTER" } });
  const master = existing
    ? existing
    : await db.user.create({ data: { role: "MASTER", username, fullName: name, passwordHash: await bcrypt.hash(password, 11) } });
  console.log(existing ? `✓ Master admin exists (@${existing.username})` : `✓ Created master admin @${username}`);

  if (process.env.SEED_SAMPLE_DATA === "false") return;
  if (await db.course.findFirst({ where: { isSample: true } })) {
    console.log("✓ Example data already present — skipping");
    return;
  }

  console.log("… creating example courses, content and sample students");
  const basics = await db.course.create({
    data: {
      slug: "biology-basics-act2-est",
      title: "Biology Basics — ACT2 & EST",
      subtitle: "Build an unshakeable foundation: cells, human systems, ecology and genetics — the way the exam asks them.",
      description:
        "The Basics course is where every Bioacademy student starts. Over 10 weeks we cover the core of the ACT2 and EST Biology syllabus with live Zoom sessions, recorded lessons, lesson notes and a full course book.\n\nEvery lesson ends with homework and every chapter ends with a quiz, so you — and Dr. Mina — always know exactly where you stand.",
      level: "BASICS",
      track: "ACT2 & EST",
      batchLabel: "Winter 2026",
      price: 6000,
      status: "PUBLISHED",
      enrollmentOpen: true,
      startDate: new Date(now - 24 * DAY),
      endDate: new Date(now + 50 * DAY),
      whatsappGroupUrl: "https://chat.whatsapp.com/EXAMPLE-replace-me",
      highlights: ["2 live Zoom sessions every week", "Recorded sessions for every class", "Homework after every lesson", "A quiz after every chapter", "Full Basics book (PDF)", "Progress analytics dashboard"],
      sortOrder: 1,
      isSample: true,
    },
  });
  const advanced = await db.course.create({
    data: {
      slug: "biology-advanced-act2-est",
      title: "Biology Advanced — ACT2 & EST",
      subtitle: "Exam-level practice, advanced genetics, evolution and plant biology — the final push to a top score.",
      description: "Advanced opens near the end of Basics and is paid for separately. It focuses on the hardest question types, timed practice and full mock exams.",
      level: "ADVANCED",
      track: "ACT2 & EST",
      batchLabel: "Winter 2026",
      price: 6000,
      status: "PUBLISHED",
      enrollmentOpen: true,
      startDate: new Date(now + 52 * DAY),
      endDate: new Date(now + 110 * DAY),
      prerequisiteId: basics.id,
      highlights: ["Exam-style timed quizzes", "Advanced genetics & evolution", "Full mock exams with analysis", "Live problem-solving sessions"],
      sortOrder: 2,
      isSample: true,
    },
  });

  // Course book
  const bookKey = `courses/${basics.id}/files/${rid()}-bioacademy-basics-book.pdf`;
  await put(
    bookKey,
    await makePdf("Bioacademy · Course book", "Biology Basics — ACT2 & EST", CONTENT.map((c) => ({ h: c.chapter, points: [c.description, ...c.lessons.map((l) => `${l.title} — ${l.description}`)] })), 3),
    "application/pdf",
  );
  await db.resource.create({ data: { courseId: basics.id, kind: "PDF", title: "Biology Basics — Full Book", storageKey: bookKey, mimeType: "application/pdf", isMainBook: true, sortOrder: 1 } });

  const assessmentsCreated: { id: string; dueAt: Date; type: "HOMEWORK" | "QUIZ" }[] = [];
  const lessonIds: string[] = [];
  for (const [ci, ch] of CONTENT.entries()) {
    const chapter = await db.chapter.create({ data: { courseId: basics.id, title: ch.chapter, description: ch.description, sortOrder: ci + 1 } });
    // Chapter timeline: chapter 1 done, 2 in progress, 3 & 4 upcoming
    const base = [-20, -8, 4, 16][ci]!;
    for (const [li, l] of ch.lessons.entries()) {
      const lesson = await db.lesson.create({ data: { chapterId: chapter.id, courseId: basics.id, title: l.title, description: l.description, sortOrder: li + 1, isPublished: ci < 3 } });
      lessonIds.push(lesson.id);
      const key = `courses/${basics.id}/files/${rid()}-notes.pdf`;
      await put(key, await makePdf(`${ch.chapter} · Lesson ${li + 1}`, l.title, l.notes), "application/pdf");
      await db.resource.create({ data: { courseId: basics.id, lessonId: lesson.id, kind: "PDF", title: `${l.title} — lesson notes`, storageKey: key, mimeType: "application/pdf", sortOrder: 1, allowDownload: li === 0 } });
      const hw = await db.assessment.create({
        data: {
          courseId: basics.id,
          type: "HOMEWORK",
          lessonId: lesson.id,
          title: `${l.title} — Homework`,
          dueAt: at(base + li * 2 + 3, 23, 59),
          answerVisibility: "AFTER_DEADLINE",
          isPublished: ci < 3,
        },
      });
      await db.question.createMany({ data: l.homework.map((q, i) => ({ ...toQuestion(q, i), assessmentId: hw.id })) });
      assessmentsCreated.push({ id: hw.id, dueAt: hw.dueAt, type: "HOMEWORK" });
    }
    const quiz = await db.assessment.create({
      data: {
        courseId: basics.id,
        type: "QUIZ",
        chapterId: chapter.id,
        title: `${ch.chapter} — Chapter Quiz`,
        instructions: "30 minutes, one attempt. Read every option carefully!",
        dueAt: at(base + 9, 23, 59),
        durationMinutes: 30,
        shuffleQuestions: true,
        answerVisibility: "AFTER_DEADLINE",
        isPublished: ci < 3,
      },
    });
    await db.question.createMany({ data: ch.quiz.map((q, i) => ({ ...toQuestion(q, i), assessmentId: quiz.id })) });
    assessmentsCreated.push({ id: quiz.id, dueAt: quiz.dueAt, type: "QUIZ" });
  }
  for (const [ci, ch] of ADVANCED.entries()) {
    const chapter = await db.chapter.create({ data: { courseId: advanced.id, title: ch.chapter, sortOrder: ci + 1 } });
    for (const [li, t] of ch.lessons.entries()) await db.lesson.create({ data: { chapterId: chapter.id, courseId: advanced.id, title: t, sortOrder: li + 1 } });
  }

  // Live sessions (past, live-ish and upcoming)
  const sessionPlan = [
    [-21, "Session 1 — Cell structure & organelles"],
    [-17, "Session 2 — Membranes & transport"],
    [-14, "Session 3 — Mitosis & meiosis"],
    [-10, "Session 4 — The circulatory system"],
    [-7, "Session 5 — Respiration & breathing"],
    [-3, "Session 6 — The nervous system"],
    [1, "Session 7 — Ecosystems & energy flow"],
    [4, "Session 8 — Biogeochemical cycles"],
    [8, "Session 9 — Mendelian genetics"],
  ] as const;
  const sessions = [];
  for (const [d, title] of sessionPlan) {
    sessions.push(
      await db.liveSession.create({
        data: { courseId: basics.id, title, description: "Bring your lesson notes and a pen. We'll solve exam-style questions at the end.", startsAt: at(d, 18), endsAt: at(d, 20), zoomUrl: "https://zoom.us/j/0000000000?pwd=EXAMPLE", meetingId: "000 000 0000", passcode: "bio" },
      }),
    );
  }

  // Sample students
  const pw = await bcrypt.hash("Student123!", 11);
  const receipts = await Promise.all(["receipt-instapay.jpg", "receipt-vodafone.jpg"].map((f) => fs.promises.readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), "sample-assets", f))));
  const proofFor = async (userId: string, k: number) => {
    const key = `payments/${userId}/${Date.now()}-${rid()}.jpg`;
    await put(key, receipts[k % 2]!, "image/jpeg");
    return key;
  };
  const allQuestions = await db.question.findMany({ where: { assessment: { courseId: basics.id } } });
  for (const [i, [fullName, whatsapp, email, skill, attendance]] of STUDENTS.entries()) {
    const u = await db.user.create({ data: { role: "STUDENT", fullName, whatsapp, email, passwordHash: pw, isSample: true, school: ["Manarat Al Farouk", "Modern English School", "Hayah International", "Dar El Tarbiah"][i % 4], lastLoginAt: new Date(now - (i + 1) * 3600_000) } });
    await db.enrollment.create({
      data: { userId: u.id, courseId: basics.id, status: "APPROVED", method: i % 2 ? "VODAFONE_CASH" : "INSTAPAY", amount: 6000, proofKey: await proofFor(u.id, i), senderNumber: whatsapp, submittedAt: new Date(now - 26 * DAY), reviewedById: master.id, reviewedAt: new Date(now - 25 * DAY) },
    });
    // Submissions for closed assessments
    for (const a of assessmentsCreated.filter((x) => x.dueAt.getTime() < now)) {
      const seed = (i * 7 + a.id.charCodeAt(3)) % 10;
      if (seed / 10 > skill + 0.15) continue; // weaker students miss some
      const qs = allQuestions.filter((q) => q.assessmentId === a.id);
      const answers: Record<string, string> = {};
      let score = 0;
      qs.forEach((q, k) => {
        const right = Math.abs(Math.sin((k + 1) * 12.9898 + (i + 1) * 78.233 + a.id.charCodeAt(5) * 3.7 + seed * 1.3) * 43758.5453) % 1 < skill;
        const opts = q.options as { id: string }[];
        const pick = right ? q.correctOptionId : opts.find((o) => o.id !== q.correctOptionId)!.id;
        answers[q.id] = pick;
        if (right) score += q.points;
      });
      await db.submission.create({ data: { assessmentId: a.id, userId: u.id, answers, score, total: qs.length, startedAt: new Date(a.dueAt.getTime() - 2 * DAY), submittedAt: new Date(a.dueAt.getTime() - 2 * DAY + 20 * 60_000) } });
    }
    // Attendance for past sessions
    for (const [k, s] of sessions.entries()) {
      if (s.endsAt.getTime() > now) continue;
      const present = ((k * 3 + i * 2) % 10) / 10 < attendance;
      if (present) await db.attendance.create({ data: { sessionId: s.id, userId: u.id, joinedAt: new Date(s.startsAt.getTime() + ((i * 4) % 15) * 60_000), joinCount: 1 } });
      else if ((k + i) % 2 === 0) await db.attendance.create({ data: { sessionId: s.id, userId: u.id, excuse: ["I had a school exam at the same time.", "Internet outage at home — I'll watch the recording.", "I was sick with a fever."][(k + i) % 3], excuseAt: new Date(s.startsAt.getTime() - 3600_000) } });
    }
    // Lesson progress
    const doneCount = Math.round(lessonIds.length * skill * 0.8);
    for (const lid of lessonIds.slice(0, doneCount)) await db.lessonProgress.create({ data: { userId: u.id, lessonId: lid, completedAt: new Date(now - Math.random() * 20 * DAY) } });
    await db.notification.create({ data: { userId: u.id, title: "You're in! Biology Basics is unlocked 🎉", body: "Open the course and join the WhatsApp group.", link: `/dashboard/courses/${basics.id}`, readAt: new Date() } });
  }
  // Two pending payments to review
  for (const [k, [fullName, whatsapp, email]] of [
    ["Hana Mohamed Samir", "+201001234509", "hana.samir@example.com"],
    ["Ziad Ayman Lotfy", "+201001234510", "ziad.ayman@example.com"],
  ].entries()) {
    const u = await db.user.create({ data: { role: "STUDENT", fullName, whatsapp, email, passwordHash: pw, isSample: true } });
    await db.enrollment.create({ data: { userId: u.id, courseId: basics.id, status: "PENDING", method: k ? "VODAFONE_CASH" : "INSTAPAY", amount: 6000, proofKey: await proofFor(u.id, k), senderNumber: whatsapp, reference: k ? null : "IPN-88231", submittedAt: new Date(now - (k + 1) * 3 * 3600_000) } });
  }
  // A question in the Q&A
  const firstStudent = await db.user.findFirst({ where: { email: STUDENTS[0][2] } });
  if (firstStudent) {
    await db.lessonComment.create({ data: { lessonId: lessonIds[3]!, userId: firstStudent.id, body: "Why is the pulmonary vein the only vein that carries oxygenated blood?" } });
  }
  await db.announcement.createMany({
    data: [
      { courseId: basics.id, authorId: master.id, isPinned: true, title: "Welcome to Biology Basics! 👋", body: "Join the WhatsApp group from the course page, download the book, and don't forget: homework is due before every next session." },
      { courseId: basics.id, authorId: master.id, title: "Human Systems quiz this week", body: "The chapter quiz opens after Session 6. You'll have 30 minutes and one attempt — revise the circulatory system diagrams!" },
    ],
  });
  console.log("✓ Example data created. Sample student login: sara.ahmed@example.com / Student123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
