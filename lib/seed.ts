import type {
  AppState,
  Assignment,
  Attendance,
  AuditEntry,
  Chapter,
  Lesson,
  PaymentTransaction,
  Profile,
  Question,
  Submission,
} from "./types"

export const STATE_VERSION = 3

export const SAMPLE_VIDEO =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
export const SAMPLE_PDF = "/docs/sample-lesson.pdf"
export const SAMPLE_BOOK = "/docs/course-book.pdf"

const hours = (n: number) => n * 60 * 60 * 1000
const days = (n: number) => n * 24 * hours(1)

export const DEMO_ACCOUNTS = [
  {
    label: "Master admin",
    name: "Dr. Mina Samuel",
    email: "dr.mina@bioacademy.com",
    password: "admin123",
    role: "master_admin" as const,
  },
  {
    label: "Co-admin",
    name: "Sara Adel",
    email: "sara@bioacademy.com",
    password: "assist123",
    role: "co_admin" as const,
  },
  {
    label: "Enrolled student",
    name: "Omar Hassan",
    email: "omar@student.com",
    password: "student123",
    role: "student" as const,
  },
  {
    label: "New student",
    name: "Nour El-Sayed",
    email: "nour@student.com",
    password: "student123",
    role: "student" as const,
  },
]

export function createSeed(nowMs: number, deviceId: string): AppState {
  const now = new Date(nowMs)
  const iso = (offsetMs: number) => new Date(nowMs + offsetMs).toISOString()

  const profiles: Profile[] = [
    {
      id: "u_master",
      role: "master_admin",
      fullName: "Dr. Mina Samuel",
      email: "dr.mina@bioacademy.com",
      whatsapp: "+20 100 000 0001",
      password: "admin123",
      status: "active",
      createdAt: iso(-days(120)),
      lastLoginAt: iso(-hours(3)),
      deviceLabel: "MacBook Pro · Safari",
      scopes: [
        "courses",
        "assignments",
        "grading",
        "sessions",
        "students",
        "payments",
        "reports",
      ],
      avatarSeed: "MS",
    },
    {
      id: "u_sara",
      role: "co_admin",
      fullName: "Sara Adel",
      email: "sara@bioacademy.com",
      whatsapp: "+20 101 234 5678",
      password: "assist123",
      status: "active",
      createdAt: iso(-days(90)),
      lastLoginAt: iso(-hours(26)),
      deviceLabel: "iPhone 15 · Safari",
      scopes: ["courses", "assignments", "grading", "sessions"],
      avatarSeed: "SA",
    },
    {
      id: "u_karim",
      role: "co_admin",
      fullName: "Karim Nabil",
      email: "karim@bioacademy.com",
      whatsapp: "+20 102 987 6543",
      password: "assist123",
      status: "active",
      createdAt: iso(-days(60)),
      lastLoginAt: iso(-days(2)),
      deviceLabel: "Windows · Chrome",
      scopes: ["sessions", "reports"],
      avatarSeed: "KN",
    },
  ]

  const studentNames: [string, string, string][] = [
    ["Omar Hassan", "omar@student.com", "+20 106 111 2233"],
    ["Nour El-Sayed", "nour@student.com", "+20 109 222 3344"],
    ["Yara Mahmoud", "yara@student.com", "+20 111 333 4455"],
    ["Ahmed Tarek", "ahmed@student.com", "+20 112 444 5566"],
    ["Mariam Fawzy", "mariam@student.com", "+20 114 555 6677"],
    ["Youssef Adel", "youssef@student.com", "+20 115 666 7788"],
    ["Salma Ibrahim", "salma@student.com", "+20 120 777 8899"],
    ["Mostafa Kamal", "mostafa@student.com", "+20 122 888 9900"],
    ["Hana Sherif", "hana@student.com", "+20 127 999 0011"],
    ["Ziad Amr", "ziad@student.com", "+20 128 100 2200"],
    ["Farida Nasser", "farida@student.com", "+20 100 200 3300"],
    ["Seif Magdy", "seif@student.com", "+20 101 300 4400"],
  ]

  studentNames.forEach(([name, email, phone], i) => {
    profiles.push({
      id: `u_s${i + 1}`,
      role: "student",
      fullName: name,
      email,
      whatsapp: phone,
      password: "student123",
      status: "active",
      createdAt: iso(-days(40 - i)),
      lastLoginAt: iso(-hours(i * 5 + 1)),
      deviceLabel: i % 3 === 0 ? "Android · Chrome" : "iPhone · Safari",
      scopes: [],
      avatarSeed: name
        .split(" ")
        .map((p) => p[0])
        .join(""),
    })
  })

  const courses = [
    {
      id: "c_basics",
      slug: "biology-basics",
      title: "Biology Basics",
      type: "basics" as const,
      tagline: "Build an unshakeable foundation in the science of life.",
      description:
        "A complete, exam-ready journey through cells, genetics, human body systems and ecology. Every recorded session is paired with slides, a homework set and a chapter quiz so nothing is left to chance.",
      priceEGP: 1800,
      batchLabel: "Basics — Fall 2026",
      whatsappLink: "https://chat.whatsapp.com/basics-fall-2026",
      status: "open" as const,
      startDate: iso(-days(21)),
      endDate: iso(days(70)),
      highlights: [
        "4 chapters · 12 recorded lessons",
        "Weekly live Zoom sessions",
        "Per-lesson homework with instant scoring",
        "Full course book (PDF) included",
      ],
      coverImage: "/images/course-basics.jpg",
      bookTitle: "Biology Basics — Complete Course Book",
      bookPages: 184,
      bookUrl: SAMPLE_BOOK,
      createdAt: iso(-days(60)),
    },
    {
      id: "c_advanced",
      slug: "advanced-biology",
      title: "Advanced Biology",
      type: "advanced" as const,
      tagline: "Go deep into molecular mechanisms, physiology and evolution.",
      description:
        "For students who finished Basics and want mastery. Molecular biology, advanced physiology, immunology and evolutionary theory, taught with the same rigor and the same instant-feedback system.",
      priceEGP: 2400,
      batchLabel: "Advanced — Winter 2027",
      prerequisiteCourseId: "c_basics",
      whatsappLink: "https://chat.whatsapp.com/advanced-winter-2027",
      status: "open" as const,
      startDate: iso(days(75)),
      endDate: iso(days(160)),
      highlights: [
        "5 chapters · 15 recorded lessons",
        "Live problem-solving sessions",
        "Past-paper style chapter quizzes",
        "Requires Biology Basics",
      ],
      coverImage: "/images/course-advanced.jpg",
      bookTitle: "Advanced Biology — Course Book",
      bookPages: 226,
      bookUrl: SAMPLE_BOOK,
      createdAt: iso(-days(30)),
    },
  ]

  const chapters: Chapter[] = [
    { id: "ch_1", courseId: "c_basics", title: "Cell Structure & Function", description: "The building blocks of every living thing: membranes, organelles and how cells make energy.", order: 1, published: true },
    { id: "ch_2", courseId: "c_basics", title: "Genetics & Heredity", description: "DNA, chromosomes, Mendel's laws and how traits pass between generations.", order: 2, published: true },
    { id: "ch_3", courseId: "c_basics", title: "Human Body Systems", description: "Digestive, circulatory, respiratory and nervous systems working together.", order: 3, published: true },
    { id: "ch_4", courseId: "c_basics", title: "Ecology & Environment", description: "Ecosystems, food webs, energy flow and the human impact on the planet.", order: 4, published: false },
    { id: "ch_a1", courseId: "c_advanced", title: "Molecular Biology", description: "Replication, transcription and translation in depth.", order: 1, published: true },
    { id: "ch_a2", courseId: "c_advanced", title: "Advanced Physiology", description: "Homeostasis, endocrine control and the kidney.", order: 2, published: true },
    { id: "ch_a3", courseId: "c_advanced", title: "Immunology", description: "Innate and adaptive immunity, vaccines and antibodies.", order: 3, published: false },
  ]

  const lessonSpec: [string, string, string, number, boolean][] = [
    ["ch_1", "Introduction to the Cell", "Prokaryotes vs eukaryotes, the cell theory and microscopy.", 42, true],
    ["ch_1", "Cell Membrane & Transport", "Phospholipid bilayer, diffusion, osmosis and active transport.", 48, true],
    ["ch_1", "Organelles & Energy", "Mitochondria, chloroplasts and the flow of energy.", 51, true],
    ["ch_2", "DNA Structure", "The double helix, nucleotides and base pairing.", 39, true],
    ["ch_2", "Mendelian Inheritance", "Alleles, dominance, Punnett squares and probability.", 55, true],
    ["ch_2", "Mutations & Variation", "Point mutations, chromosomal changes and their effects.", 44, true],
    ["ch_3", "Digestive System", "Enzymes, absorption and the journey of food.", 47, true],
    ["ch_3", "Circulatory System", "The heart, blood vessels and the double circulation.", 50, true],
    ["ch_3", "Nervous System", "Neurons, synapses and reflex arcs.", 46, false],
    ["ch_4", "Ecosystems & Food Webs", "Producers, consumers and trophic levels.", 40, false],
    ["ch_4", "Energy Flow & Cycles", "Carbon and nitrogen cycles.", 43, false],
    ["ch_4", "Human Impact", "Pollution, climate change and conservation.", 38, false],
    ["ch_a1", "DNA Replication", "Helicase, polymerase and the replication fork.", 52, true],
    ["ch_a1", "Transcription & Translation", "From gene to protein.", 58, true],
    ["ch_a2", "Homeostasis", "Negative feedback loops and thermoregulation.", 49, true],
  ]

  const lessons: Lesson[] = lessonSpec.map(([chapterId, title, description, durationMin, published], i) => {
    const chapter = chapters.find((c) => c.id === chapterId)!
    const order = lessonSpec.slice(0, i).filter((l) => l[0] === chapterId).length + 1
    return {
      id: `l_${i + 1}`,
      chapterId,
      courseId: chapter.courseId,
      title,
      description,
      order,
      published,
      durationMin,
      videoUrl: SAMPLE_VIDEO,
      pdfUrl: SAMPLE_PDF,
      pdfPages: 12 + ((i * 7) % 9),
    }
  })

  const assignments: Assignment[] = []
  const questions: Question[] = []

  const questionBank: Record<string, [string, string[], number][]> = {
    ch_1: [
      ["Which organelle is known as the powerhouse of the cell?", ["Ribosome", "Mitochondrion", "Golgi apparatus", "Lysosome"], 1],
      ["The cell membrane is primarily composed of:", ["Cellulose", "Proteins only", "A phospholipid bilayer", "Nucleic acids"], 2],
      ["Which process moves water across a semi-permeable membrane?", ["Osmosis", "Active transport", "Phagocytosis", "Translation"], 0],
      ["Prokaryotic cells lack which structure?", ["Ribosomes", "Cell membrane", "Nucleus", "Cytoplasm"], 2],
      ["Photosynthesis occurs in the:", ["Mitochondria", "Chloroplast", "Nucleus", "Vacuole"], 1],
    ],
    ch_2: [
      ["DNA bases pair as:", ["A–G, C–T", "A–T, C–G", "A–C, G–T", "A–A, T–T"], 1],
      ["A heterozygous individual has:", ["Two identical alleles", "Two different alleles", "No alleles", "Three alleles"], 1],
      ["In a monohybrid cross of two heterozygotes, the phenotypic ratio is:", ["1:1", "1:2:1", "3:1", "9:3:3:1"], 2],
      ["A change in a single nucleotide is called a:", ["Deletion", "Point mutation", "Inversion", "Translocation"], 1],
      ["The shape of DNA is best described as a:", ["Single strand", "Triple helix", "Double helix", "Flat sheet"], 2],
    ],
    ch_3: [
      ["Which enzyme begins starch digestion in the mouth?", ["Pepsin", "Lipase", "Amylase", "Trypsin"], 2],
      ["Humans have a double circulation, meaning blood passes through the heart:", ["Once per cycle", "Twice per cycle", "Never", "Three times"], 1],
      ["The junction between two neurons is the:", ["Axon", "Dendrite", "Synapse", "Myelin"], 2],
      ["Oxygenated blood leaves the heart through the:", ["Pulmonary artery", "Vena cava", "Aorta", "Pulmonary vein"], 2],
      ["Most nutrient absorption happens in the:", ["Stomach", "Large intestine", "Small intestine", "Oesophagus"], 2],
    ],
    ch_4: [
      ["Organisms that make their own food are:", ["Consumers", "Decomposers", "Producers", "Predators"], 2],
      ["Which gas is most associated with the greenhouse effect?", ["Nitrogen", "Carbon dioxide", "Oxygen", "Argon"], 1],
    ],
    ch_a1: [
      ["Which enzyme unwinds the DNA double helix?", ["Ligase", "Helicase", "Primase", "Polymerase"], 1],
      ["Translation takes place at the:", ["Nucleus", "Ribosome", "Mitochondrion", "Lysosome"], 1],
      ["mRNA is synthesised during:", ["Replication", "Translation", "Transcription", "Mutation"], 2],
    ],
    ch_a2: [
      ["Negative feedback tends to:", ["Amplify change", "Reverse change", "Ignore change", "Randomise change"], 1],
      ["The hormone that lowers blood glucose is:", ["Glucagon", "Insulin", "Adrenaline", "Thyroxine"], 1],
    ],
  }

  let qCounter = 1
  const addQuestions = (assignmentId: string, chapterId: string, take: number, offset = 0) => {
    const bank = questionBank[chapterId] ?? []
    for (let i = 0; i < take && i < bank.length; i++) {
      const [text, options, correctIndex] = bank[(i + offset) % bank.length]
      questions.push({ id: `q_${qCounter++}`, assignmentId, text, options, correctIndex, order: i + 1 })
    }
  }

  // Homework per lesson (first two lessons of each published chapter) + quiz per chapter
  const hwDeadlines: Record<string, number> = {
    l_1: -days(12),
    l_2: -days(8),
    l_4: -days(3),
    l_5: days(2),
    l_7: days(5),
    l_8: days(9),
    l_13: days(80),
    l_14: days(83),
    l_15: days(88),
  }
  Object.entries(hwDeadlines).forEach(([lessonId, offset], i) => {
    const lesson = lessons.find((l) => l.id === lessonId)!
    const id = `a_hw_${i + 1}`
    assignments.push({
      id,
      courseId: lesson.courseId,
      chapterId: lesson.chapterId,
      lessonId,
      kind: "homework",
      title: `Homework: ${lesson.title}`,
      deadline: iso(offset),
      totalPoints: 10,
      maxAttempts: i % 2 === 0 ? 1 : 2,
      showCorrectAnswers: true,
      published: lesson.published,
    })
    addQuestions(id, lesson.chapterId, 2, i)
  })

  const quizDeadlines: Record<string, number> = {
    ch_1: -days(5),
    ch_2: days(4),
    ch_3: days(14),
    ch_4: days(30),
    ch_a1: days(95),
    ch_a2: days(110),
  }
  Object.entries(quizDeadlines).forEach(([chapterId, offset], i) => {
    const chapter = chapters.find((c) => c.id === chapterId)!
    const id = `a_quiz_${i + 1}`
    assignments.push({
      id,
      courseId: chapter.courseId,
      chapterId,
      kind: "quiz",
      title: `Chapter Quiz: ${chapter.title}`,
      deadline: iso(offset),
      totalPoints: 20,
      maxAttempts: 1,
      showCorrectAnswers: chapterId !== "ch_2",
      published: chapter.published,
    })
    addQuestions(id, chapterId, 5)
  })

  const submissions: Submission[] = []
  let subCounter = 1
  const submit = (studentId: string, assignmentId: string, correctness: number, offset: number) => {
    const qs = questions.filter((q) => q.assignmentId === assignmentId)
    const assignment = assignments.find((a) => a.id === assignmentId)!
    const answers = qs.map((q, idx) => (idx / qs.length < correctness ? q.correctIndex : (q.correctIndex + 1) % q.options.length))
    const correct = answers.filter((a, idx) => a === qs[idx].correctIndex).length
    const score = qs.length ? Math.round((correct / qs.length) * assignment.totalPoints) : 0
    submissions.push({
      id: `sub_${subCounter++}`,
      assignmentId,
      studentId,
      answers,
      score,
      submittedAt: iso(offset),
      attempt: 1,
    })
  }

  // Enrolled students: s1..s10 in basics (s2 = Nour is NOT enrolled), s11, s12 enrolled too
  const enrolledStudentIds = ["u_s1", "u_s3", "u_s4", "u_s5", "u_s6", "u_s7", "u_s8", "u_s9", "u_s10", "u_s11", "u_s12"]
  const closedAssignments = ["a_hw_1", "a_hw_2", "a_hw_3", "a_quiz_1"]
  const perf = [0.95, 0.8, 0.6, 0.9, 0.7, 0.5, 1, 0.65, 0.85, 0.75, 0.4]
  enrolledStudentIds.forEach((sid, i) => {
    closedAssignments.forEach((aid, j) => {
      // some students never submitted some items
      if ((i + j) % 5 === 4) return
      submit(sid, aid, perf[i] - (j % 2) * 0.1, -days(13 - j * 3) + hours(i))
    })
  })

  const transactions: PaymentTransaction[] = enrolledStudentIds.map((sid, i) => ({
    id: `tx_${i + 1}`,
    studentId: sid,
    courseId: "c_basics",
    gateway: i % 4 === 0 ? "kashier" : "paymob",
    method: i % 2 === 0 ? "instapay" : "vodafone_cash",
    amount: 1800,
    status: "success",
    gatewayRef: `PMB-${(48210 + i * 37).toString(36).toUpperCase()}`,
    createdAt: iso(-days(35 - i * 2)),
    completedAt: iso(-days(35 - i * 2) + 8000),
  }))
  transactions.push({
    id: "tx_declined",
    studentId: "u_s2",
    courseId: "c_basics",
    gateway: "paymob",
    method: "vodafone_cash",
    amount: 1800,
    status: "declined",
    gatewayRef: "PMB-DCL91",
    createdAt: iso(-days(2)),
    completedAt: iso(-days(2) + 12000),
    failureReason: "Insufficient wallet balance",
  })

  const enrollments = enrolledStudentIds.map((sid, i) => ({
    id: `en_${i + 1}`,
    studentId: sid,
    courseId: "c_basics",
    status: "paid" as const,
    amountPaid: 1800,
    enrolledAt: iso(-days(35 - i * 2) + 8000),
    transactionId: `tx_${i + 1}`,
  }))

  const sessions = [
    {
      id: "ls_1",
      courseId: "c_basics",
      chapterId: "ch_1",
      title: "Live: Cells, membranes and transport",
      zoomLink: "https://zoom.us/j/8123456781",
      startsAt: iso(-days(10)),
      endsAt: iso(-days(10) + hours(1.5)),
      createdBy: "u_sara",
    },
    {
      id: "ls_2",
      courseId: "c_basics",
      chapterId: "ch_2",
      title: "Live: DNA and Mendel's laws",
      zoomLink: "https://zoom.us/j/8123456782",
      startsAt: iso(-days(3)),
      endsAt: iso(-days(3) + hours(1.5)),
      createdBy: "u_sara",
    },
    {
      id: "ls_3",
      courseId: "c_basics",
      chapterId: "ch_2",
      title: "Live: Mutations, variation and exam technique",
      zoomLink: "https://zoom.us/j/8123456783",
      startsAt: iso(-hours(0.4)),
      endsAt: iso(hours(1.2)),
      createdBy: "u_master",
    },
    {
      id: "ls_4",
      courseId: "c_basics",
      chapterId: "ch_3",
      title: "Live: The digestive system",
      zoomLink: "https://zoom.us/j/8123456784",
      startsAt: iso(days(4) + hours(2)),
      endsAt: iso(days(4) + hours(3.5)),
      createdBy: "u_sara",
    },
    {
      id: "ls_5",
      courseId: "c_basics",
      chapterId: "ch_3",
      title: "Live: Heart and circulation",
      zoomLink: "https://zoom.us/j/8123456785",
      startsAt: iso(days(11) + hours(2)),
      endsAt: iso(days(11) + hours(3.5)),
      createdBy: "u_sara",
    },
  ]

  const attendance: Attendance[] = []
  let attCounter = 1
  ;["ls_1", "ls_2"].forEach((sessionId, si) => {
    enrolledStudentIds.forEach((sid, i) => {
      const present = (i + si) % 4 !== 3
      const excused = !present && i % 2 === 0
      const session = sessions.find((s) => s.id === sessionId)!
      attendance.push({
        id: `att_${attCounter++}`,
        sessionId,
        studentId: sid,
        status: present ? "present" : "absent",
        joinedAt: present ? new Date(new Date(session.startsAt).getTime() + i * 90000).toISOString() : undefined,
        excuse: excused ? "I had a power cut in my area and could not connect." : undefined,
        excuseAt: excused ? new Date(new Date(session.startsAt).getTime() + hours(1)).toISOString() : undefined,
      })
    })
  })
  // live session: a few already joined
  ;["u_s3", "u_s4", "u_s7", "u_s9", "u_s11"].forEach((sid, i) => {
    attendance.push({
      id: `att_${attCounter++}`,
      sessionId: "ls_3",
      studentId: sid,
      status: "present",
      joinedAt: iso(-hours(0.35) + i * 120000),
    })
  })

  const progress = [
    ["u_s1", "l_1"], ["u_s1", "l_2"], ["u_s1", "l_3"], ["u_s1", "l_4"],
    ["u_s3", "l_1"], ["u_s3", "l_2"], ["u_s3", "l_3"], ["u_s3", "l_4"], ["u_s3", "l_5"], ["u_s3", "l_6"],
    ["u_s4", "l_1"], ["u_s4", "l_2"],
    ["u_s5", "l_1"], ["u_s5", "l_2"], ["u_s5", "l_3"], ["u_s5", "l_4"], ["u_s5", "l_5"],
    ["u_s7", "l_1"], ["u_s7", "l_2"], ["u_s7", "l_3"], ["u_s7", "l_4"], ["u_s7", "l_5"], ["u_s7", "l_6"], ["u_s7", "l_7"],
  ].map(([studentId, lessonId], i) => ({ studentId, lessonId, watchedAt: iso(-days(10) + hours(i * 6)) }))

  const announcements = [
    {
      id: "an_1",
      courseId: "c_basics",
      title: "Chapter 2 quiz opens this week",
      body: "The Genetics & Heredity quiz is now published. You get a single attempt, so revise Mendel's laws before you start. Deadline is in 4 days.",
      createdAt: iso(-hours(20)),
      authorId: "u_master",
    },
    {
      id: "an_2",
      courseId: "c_basics",
      title: "Slides for lesson 5 uploaded",
      body: "The full slide deck for Mendelian Inheritance is now attached to the lesson. Open it in the browser viewer from the lesson page.",
      createdAt: iso(-days(2)),
      authorId: "u_sara",
    },
  ]

  const audit: AuditEntry[] = [
    { id: "au_1", actorId: "u_sara", actorName: "Sara Adel", action: "Uploaded PDF", target: "Lesson: Mendelian Inheritance", at: iso(-days(2)) },
    { id: "au_2", actorId: "u_master", actorName: "Dr. Mina Samuel", action: "Published quiz", target: "Chapter Quiz: Genetics & Heredity", at: iso(-hours(20)) },
    { id: "au_3", actorId: "u_sara", actorName: "Sara Adel", action: "Scheduled session", target: "Live: The digestive system", at: iso(-hours(15)) },
    { id: "au_4", actorId: "u_master", actorName: "Dr. Mina Samuel", action: "Generated report", target: "Attendance — Live: DNA and Mendel's laws", at: iso(-days(3) + hours(2)) },
    { id: "au_5", actorId: "u_karim", actorName: "Karim Nabil", action: "Ended session", target: "Live: DNA and Mendel's laws", at: iso(-days(3) + hours(1.5)) },
    { id: "au_6", actorId: "u_master", actorName: "Dr. Mina Samuel", action: "Started session", target: "Live: Mutations, variation and exam technique", at: iso(-hours(0.4)) },
  ]

  const reports = [
    {
      id: "rp_1",
      courseId: "c_basics",
      kind: "attendance" as const,
      title: "Attendance — Live: Cells, membranes and transport",
      createdAt: iso(-days(10) + hours(2)),
      createdBy: "u_master",
      sizeKB: 84,
      sessionId: "ls_1",
      columns: ["Student", "WhatsApp", "Status", "Excuse"],
      rows: enrolledStudentIds.map((sid) => {
        const p = profiles.find((x) => x.id === sid)!
        const a = attendance.find((x) => x.sessionId === "ls_1" && x.studentId === sid)!
        return {
          Student: p.fullName,
          WhatsApp: p.whatsapp,
          Status: a.status === "present" ? "Present" : a.excuse ? "Absent — excuse given" : "Absent — excuse not given",
          Excuse: a.excuse ?? "—",
        }
      }),
    },
    {
      id: "rp_2",
      courseId: "c_basics",
      kind: "attendance" as const,
      title: "Attendance — Live: DNA and Mendel's laws",
      createdAt: iso(-days(3) + hours(2)),
      createdBy: "u_master",
      sizeKB: 86,
      sessionId: "ls_2",
      columns: ["Student", "WhatsApp", "Status", "Excuse"],
      rows: enrolledStudentIds.map((sid) => {
        const p = profiles.find((x) => x.id === sid)!
        const a = attendance.find((x) => x.sessionId === "ls_2" && x.studentId === sid)!
        return {
          Student: p.fullName,
          WhatsApp: p.whatsapp,
          Status: a.status === "present" ? "Present" : a.excuse ? "Absent — excuse given" : "Absent — excuse not given",
          Excuse: a.excuse ?? "—",
        }
      }),
    },
    {
      id: "rp_3",
      courseId: "c_basics",
      kind: "grades" as const,
      title: "Grades — Chapter Quiz: Cell Structure & Function",
      createdAt: iso(-days(5) + hours(1)),
      createdBy: "u_sara",
      sizeKB: 71,
      assignmentId: "a_quiz_1",
      columns: ["Student", "Score", "Out of", "Submitted"],
      rows: enrolledStudentIds.map((sid) => {
        const p = profiles.find((x) => x.id === sid)!
        const s = submissions.find((x) => x.assignmentId === "a_quiz_1" && x.studentId === sid)
        return {
          Student: p.fullName,
          Score: s ? s.score : "Missing",
          "Out of": 20,
          Submitted: s ? new Date(s.submittedAt).toLocaleDateString("en-GB") : "—",
        }
      }),
    },
  ]

  const qa = [
    {
      id: "qa_1",
      lessonId: "l_2",
      studentId: "u_s3",
      question: "Is facilitated diffusion considered active or passive transport?",
      createdAt: iso(-days(6)),
      answer: "Passive. It uses carrier or channel proteins but no ATP, and moves substances down their concentration gradient.",
      answeredBy: "u_master",
      answeredAt: iso(-days(6) + hours(3)),
      approved: true,
    },
    {
      id: "qa_2",
      lessonId: "l_2",
      studentId: "u_s1",
      question: "Why does a red blood cell burst in distilled water but a plant cell does not?",
      createdAt: iso(-days(1)),
      approved: true,
    },
  ]

  void now
  return {
    version: STATE_VERSION,
    currentUserId: null,
    deviceId,
    profiles,
    courses,
    chapters,
    lessons,
    assignments,
    questions,
    submissions,
    transactions,
    enrollments,
    sessions,
    attendance,
    reports,
    progress,
    announcements,
    audit,
    qa,
  }
}
