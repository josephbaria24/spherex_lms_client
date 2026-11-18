export type IeltsMaterialKind = "paper" | "audio" | "answers"

export type IeltsSkill = "Listening" | "Reading" | "Writing" | "Speaking"

export type IeltsAcademicMaterial = {
  id: string
  title: string
  detail: string
  href: string
  kind: IeltsMaterialKind
}

export type IeltsAcademicMock = {
  id: string
  day: string
  title: string
  note?: string
  /** Opens interactive practice (Listening/Reading mock taker) instead of a static file. */
  practiceTitle?: string
  files: IeltsAcademicMaterial[]
}

export type IeltsSkillMockItem = {
  id: string
  /** Session gate id shared with the Day mock (mock-1 … mock-5). Null = not session-gated. */
  mockId: string | null
  title: string
  day?: string
  practiceTitle?: string
  ctaLabel: string
  /** Single fallback file when interactive practice is not available. */
  primaryFile?: IeltsAcademicMaterial
}

export type IeltsSkillMockGroup = {
  skill: IeltsSkill
  blurb: string
  items: IeltsSkillMockItem[]
}

function paper(mockN: number): IeltsAcademicMaterial {
  return {
    id: `mock-${mockN}-paper`,
    title: "Question paper",
    detail: "PDF",
    href: `/ielts-academic/academic-mock-${mockN}-questions.pdf`,
    kind: "paper",
  }
}

function audio(mockN: number, title = "Listening"): IeltsAcademicMaterial {
  return {
    id: `mock-${mockN}-audio`,
    title,
    detail: mockN === 1 ? "MP3" : "Audio",
    href: `/ielts-academic/academic-mock-${mockN}-listening.mp3`,
    kind: "audio",
  }
}

export const IELTS_ACADEMIC_MOCKS: IeltsAcademicMock[] = [
  {
    id: "mock-1",
    day: "Day 1",
    title: "Academic mock test 1",
    note: "Interactive Listening mock available — audio at the top, type answers on the page.",
    practiceTitle: "IELTS Listening — Mock Test 1",
    files: [paper(1), audio(1, "Listening audio only")],
  },
  {
    id: "mock-2",
    day: "Day 2",
    title: "Academic mock test 2",
    files: [paper(2), audio(2)],
  },
  {
    id: "mock-3",
    day: "Day 3",
    title: "Academic mock test 3",
    files: [paper(3), audio(3)],
  },
  {
    id: "mock-4",
    day: "Day 4",
    title: "Academic mock test 4",
    files: [paper(4), audio(4)],
  },
  {
    id: "mock-5",
    day: "Day 5",
    title: "Academic mock test 5",
    files: [paper(5), audio(5)],
  },
]

export const IELTS_ACADEMIC_KEYS: IeltsAcademicMaterial[] = [
  {
    id: "listening-answers",
    title: "Listening answers",
    detail: "PDF",
    href: "/ielts-academic/academic-listening-answers.pdf",
    kind: "answers",
  },
  {
    id: "reading-answers",
    title: "Reading answers",
    detail: "PDF",
    href: "/ielts-academic/academic-reading-answers.pdf",
    kind: "answers",
  },
  {
    id: "writing-examples",
    title: "Writing examples",
    detail: "PDF",
    href: "/ielts-academic/academic-writing-examples.pdf",
    kind: "answers",
  },
]

/** Learner hub: mocks grouped by skill, one Take CTA each. */
export const IELTS_ACADEMIC_SKILL_GROUPS: IeltsSkillMockGroup[] = [
  {
    skill: "Listening",
    blurb: "Live-session listening mocks for each academic day.",
    items: [
      {
        id: "listening-mock-1",
        mockId: "mock-1",
        title: "Mock test 1",
        day: "Day 1",
        practiceTitle: "IELTS Listening — Mock Test 1",
        ctaLabel: "Take Listening mock",
      },
      {
        id: "listening-mock-2",
        mockId: "mock-2",
        title: "Mock test 2",
        day: "Day 2",
        ctaLabel: "Take Listening mock",
        primaryFile: audio(2),
      },
      {
        id: "listening-mock-3",
        mockId: "mock-3",
        title: "Mock test 3",
        day: "Day 3",
        ctaLabel: "Take Listening mock",
        primaryFile: audio(3),
      },
      {
        id: "listening-mock-4",
        mockId: "mock-4",
        title: "Mock test 4",
        day: "Day 4",
        ctaLabel: "Take Listening mock",
        primaryFile: audio(4),
      },
      {
        id: "listening-mock-5",
        mockId: "mock-5",
        title: "Mock test 5",
        day: "Day 5",
        ctaLabel: "Take Listening mock",
        primaryFile: audio(5),
      },
    ],
  },
  {
    skill: "Reading",
    blurb: "Live-session reading mocks — interactive when available, otherwise the question paper.",
    items: [
      {
        id: "reading-mock-1",
        mockId: "mock-1",
        title: "Mock test 1",
        day: "Day 1",
        practiceTitle: "IELTS Reading — Mock Test 1",
        ctaLabel: "Take Reading mock",
      },
      {
        id: "reading-mock-2",
        mockId: "mock-2",
        title: "Mock test 2",
        day: "Day 2",
        practiceTitle: "IELTS Reading — Mock Test 2",
        ctaLabel: "Take Reading mock",
      },
      {
        id: "reading-mock-3",
        mockId: "mock-3",
        title: "Mock test 3",
        day: "Day 3",
        practiceTitle: "IELTS Reading — Mock Test 3",
        ctaLabel: "Take Reading mock",
      },
      {
        id: "reading-mock-4",
        mockId: "mock-4",
        title: "Mock test 4",
        day: "Day 4",
        ctaLabel: "Take Reading mock",
        primaryFile: paper(4),
      },
      {
        id: "reading-mock-5",
        mockId: "mock-5",
        title: "Mock test 5",
        day: "Day 5",
        ctaLabel: "Take Reading mock",
        primaryFile: paper(5),
      },
    ],
  },
  {
    skill: "Writing",
    blurb: "Session writing pack — model Task 1 and Task 2 responses.",
    items: [
      {
        id: "writing-examples",
        mockId: null,
        title: "Writing examples",
        ctaLabel: "Take Writing mock",
        primaryFile: IELTS_ACADEMIC_KEYS.find((k) => k.id === "writing-examples"),
      },
    ],
  },
  {
    skill: "Speaking",
    blurb: "Full speaking mocks for live sessions are coming soon.",
    items: [],
  },
]

/** Map static mock asset paths → mock id for session gating. */
export const IELTS_MOCK_PATH_TO_ID: Record<string, string> = Object.fromEntries(
  IELTS_ACADEMIC_MOCKS.flatMap((mock) => mock.files.map((file) => [file.href, mock.id])),
)

export const IELTS_MOCK_IDS = IELTS_ACADEMIC_MOCKS.map((mock) => mock.id)

export function isMockOpenForSession(
  mockId: string,
  mockSessionOpen: boolean,
  openMockIds: string[] | null | undefined,
): boolean {
  if (!mockSessionOpen) return false
  if (!openMockIds || openMockIds.length === 0) return true
  return openMockIds.includes(mockId)
}
