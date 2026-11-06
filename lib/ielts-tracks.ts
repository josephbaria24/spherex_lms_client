export type IeltsTrackId = "academic" | "general" | "ukvi"

export const IELTS_TRACKS: {
  id: IeltsTrackId
  title: string
  description: string
  image: string
  imageAlt: string
  available: boolean
}[] = [
  {
    id: "academic",
    title: "IELTS Academic",
    description: "University and professional practice for listening, reading, writing, and speaking.",
    image: "/ielts-track-academic.webp",
    imageAlt: "Graduation cap over an academic textbook",
    available: true,
  },
  {
    id: "general",
    title: "IELTS General Training",
    description: "Everyday reading and letter-style writing practice for work and migration.",
    image: "/ielts-track-general.webp",
    imageAlt: "Letter, books, and a pencil",
    available: true,
  },
  {
    id: "ukvi",
    title: "IELTS for UKVI Life Skills",
    description: "Speaking and listening practice for UK visa Life Skills routes.",
    image: "/ielts-track-ukvi.webp",
    imageAlt: "Headphones with listening and speaking icons",
    available: false,
  },
]
