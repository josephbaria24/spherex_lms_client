export type IeltsTrackId = "academic" | "general" | "ukvi"

export const IELTS_TRACKS: {
  id: IeltsTrackId
  title: string
  description: string
  image: string
  imageAlt: string
}[] = [
  {
    id: "academic",
    title: "IELTS Academic",
    description: "University and professional practice for listening, reading, writing, and speaking.",
    image: "/Navy cap, burgundy book, golden pencil-1.png",
    imageAlt: "Graduation cap over an academic textbook",
  },
  {
    id: "general",
    title: "IELTS General Training",
    description: "Everyday reading and letter-style writing practice for work and migration.",
    image: "/Open envelope, books, and pencil-2.png",
    imageAlt: "Letter, books, and a pencil",
  },
  {
    id: "ukvi",
    title: "IELTS for UKVI Life Skills",
    description: "Speaking and listening practice for UK visa Life Skills routes.",
    image: "/IELTS Listening and Speaking Illustration-3.png",
    imageAlt: "Headphones with listening and speaking icons",
  },
]
