export type IeltsMaterialKind = "paper" | "audio" | "answers"

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
  files: IeltsAcademicMaterial[]
}

export const IELTS_ACADEMIC_MOCKS: IeltsAcademicMock[] = [
  {
    id: "mock-1",
    day: "Day 1",
    title: "Academic mock test 1",
    note: "Question paper only. This set has no listening recording.",
    files: [
      {
        id: "mock-1-paper",
        title: "Question paper",
        detail: "PDF",
        href: "/ielts-academic/academic-mock-1-questions.pdf",
        kind: "paper",
      },
    ],
  },
  {
    id: "mock-2",
    day: "Day 2",
    title: "Academic mock test 2",
    files: [
      {
        id: "mock-2-paper",
        title: "Question paper",
        detail: "PDF",
        href: "/ielts-academic/academic-mock-2-questions.pdf",
        kind: "paper",
      },
      {
        id: "mock-2-audio",
        title: "Listening",
        detail: "Audio",
        href: "/ielts-academic/academic-mock-2-listening.mp3",
        kind: "audio",
      },
    ],
  },
  {
    id: "mock-3",
    day: "Day 3",
    title: "Academic mock test 3",
    files: [
      {
        id: "mock-3-paper",
        title: "Question paper",
        detail: "PDF",
        href: "/ielts-academic/academic-mock-3-questions.pdf",
        kind: "paper",
      },
      {
        id: "mock-3-audio",
        title: "Listening",
        detail: "Audio",
        href: "/ielts-academic/academic-mock-3-listening.mp3",
        kind: "audio",
      },
    ],
  },
  {
    id: "mock-4",
    day: "Day 4",
    title: "Academic mock test 4",
    files: [
      {
        id: "mock-4-paper",
        title: "Question paper",
        detail: "PDF",
        href: "/ielts-academic/academic-mock-4-questions.pdf",
        kind: "paper",
      },
      {
        id: "mock-4-audio",
        title: "Listening",
        detail: "Audio",
        href: "/ielts-academic/academic-mock-4-listening.mp3",
        kind: "audio",
      },
    ],
  },
  {
    id: "mock-5",
    day: "Day 5",
    title: "Academic mock test 5",
    files: [
      {
        id: "mock-5-paper",
        title: "Question paper",
        detail: "PDF",
        href: "/ielts-academic/academic-mock-5-questions.pdf",
        kind: "paper",
      },
      {
        id: "mock-5-audio",
        title: "Listening",
        detail: "Audio",
        href: "/ielts-academic/academic-mock-5-listening.mp3",
        kind: "audio",
      },
    ],
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
