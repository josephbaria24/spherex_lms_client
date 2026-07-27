import type { Course, ELearningMaterial, TrainingSession } from "./types"

// Mock data for development (will be replaced with database later)

export const mockCourses: Course[] = [
  {
    id: "1",
    title: "Advanced Safety Protocols",
    description: "Comprehensive training on industry safety standards and best practices",
    category: "Safety & Compliance",
    duration: "4 weeks",
    level: "advanced",
    enrolledCount: 124,
    progress: 65,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-02-20"),
  },
  {
    id: "2",
    title: "Technical Writing Fundamentals",
    description: "Learn to create clear, concise technical documentation",
    category: "Technical Skills",
    duration: "3 weeks",
    level: "intermediate",
    enrolledCount: 89,
    progress: 30,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "3",
    title: "Leadership Excellence",
    description: "Develop essential leadership skills for modern workplace",
    category: "Leadership",
    duration: "6 weeks",
    level: "advanced",
    enrolledCount: 156,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-25"),
  },
]

export const mockMaterials: ELearningMaterial[] = [
  {
    id: "1",
    title: "EILTS Academic Writing Guide",
    type: "EILTS",
    description: "Complete guide to EILTS academic writing tasks",
    category: "Language Learning",
    tags: ["EILTS", "Writing", "Academic"],
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "2",
    title: "TOEFL Speaking Practice",
    type: "TOEFL",
    description: "Interactive speaking exercises for TOEFL preparation",
    category: "Language Learning",
    tags: ["TOEFL", "Speaking", "Practice"],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-02-12"),
  },
  {
    id: "3",
    title: "Technical Communication Handbook",
    type: "Technical",
    description: "Essential guide for technical communication in engineering",
    category: "Technical Skills",
    tags: ["Technical", "Communication", "Engineering"],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-18"),
  },
]

export const mockTrainingSessions: TrainingSession[] = [
  {
    id: "1",
    title: "Safety Orientation Workshop",
    courseId: "1",
    scheduledDate: new Date("2024-03-15T09:00:00"),
    duration: 120,
    instructor: "Harthwell Capistrano",
    status: "upcoming",
    participants: 24,
    maxParticipants: 30,
  },
  {
    id: "2",
    title: "Technical Writing Bootcamp",
    courseId: "2",
    scheduledDate: new Date("2024-03-18T14:00:00"),
    duration: 180,
    instructor: "Carmela Joice Padilla",
    status: "upcoming",
    participants: 18,
    maxParticipants: 25,
  },
]
