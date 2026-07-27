import type React from "react"
// Type definitions for the application

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  avatar?: string
}

export interface Course {
  id: string
  title: string
  description: string
  category: string
  thumbnail?: string
  duration: string
  level: "beginner" | "intermediate" | "advanced"
  enrolledCount: number
  progress?: number
  priceCents?: number
  requiresEnrollCode?: boolean
  isEnrolled?: boolean
  organizationName?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ELearningMaterial {
  id: string
  title: string
  type: "EILTS" | "TOEFL" | "Technical" | "Soft Skills" | "Other"
  description: string
  fileUrl?: string
  thumbnail?: string
  category: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface TrainingSession {
  id: string
  title: string
  courseId: string
  scheduledDate: Date
  duration: number
  instructor: string
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  participants: number
  maxParticipants: number
}

export type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}


