export type CourseFormValues = {
  title: string;
  subtitle: string;
  description: string;
  level: "BASICS" | "ADVANCED";
  track: string;
  batchLabel: string;
  price: number;
  coverKey: string | null;
  coverUrl: string | null;
  introVideoUrl: string;
  highlights: string[];
  status: "DRAFT" | "PUBLISHED" | "ENDED";
  enrollmentOpen: boolean;
  startDate: string;
  endDate: string;
  prerequisiteId: string | null;
  whatsappGroupUrl: string;
  sortOrder: number;
};

export const EMPTY_COURSE: CourseFormValues = {
  title: "",
  subtitle: "",
  description: "",
  level: "BASICS",
  track: "ACT2 & EST",
  batchLabel: "",
  price: 6000,
  coverKey: null,
  coverUrl: null,
  introVideoUrl: "",
  highlights: ["Live Zoom sessions with automatic attendance", "Recorded sessions for every class", "Homework after every lesson", "A quiz after every chapter", "Full course book (PDF)"],
  status: "DRAFT",
  enrollmentOpen: true,
  startDate: "",
  endDate: "",
  prerequisiteId: null,
  whatsappGroupUrl: "",
  sortOrder: 0,
};
