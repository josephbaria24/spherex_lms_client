import type { LucideIcon } from "lucide-react"
import {
  MonitorPlay,
  Users,
  Stethoscope,
  Landmark,
  Languages,
  Shield,
  GraduationCap,
} from "lucide-react"

export type CategoryGroupId = "formats" | "exam-prep" | "language" | "organizations"

export type LandingCategory = {
  id: string
  name: string
  description: string
  href: string
  icon: LucideIcon
  count?: number
  badge?: string
}

export type LandingCategoryGroup = {
  id: CategoryGroupId
  label: string
  items: LandingCategory[]
}

/** SphereX learning offerings — courses vary by partner organization. */
export const landingCategoryGroups: LandingCategoryGroup[] = [
  {
    id: "formats",
    label: "Learning Formats",
    items: [
      {
        id: "self-paced",
        name: "Self-Paced E-Learning",
        description: "Learn anytime with on-demand modules and progress tracking.",
        href: "/courses",
        icon: MonitorPlay,
        count: 120,
      },
      {
        id: "blended",
        name: "Blended & Instructor-Led",
        description: "Online modules plus live skills sessions and evaluations.",
        href: "/courses",
        icon: Users,
        count: 45,
        badge: "Popular",
      },
    ],
  },
  {
    id: "exam-prep",
    label: "Exam & License Reviews",
    items: [
      {
        id: "nle",
        name: "NLE Review",
        description: "Nursing Licensure Exam review programs and practice materials.",
        href: "/reviewers?exam=NLE",
        icon: Stethoscope,
      },
      {
        id: "cse",
        name: "Civil Service Exam Review",
        description: "CSE prep for professional and sub-professional levels.",
        href: "/reviewers?exam=CSE",
        icon: Landmark,
      },
    ],
  },
  {
    id: "language",
    label: "Language Training",
    items: [
      {
        id: "ielts",
        name: "IELTS Preparation",
        description: "Reading, writing, listening, and speaking prep for IELTS.",
        href: "/ielts",
        icon: Languages,
      },
    ],
  },
  {
    id: "organizations",
    label: "By Organization",
    items: [
      {
        id: "petrosphere",
        name: "Petrosphere",
        description:
          "DOLE-recognized HSE & safety training — migrating from Petrosphere eLearning.",
        href: "/organizations/petrosphere",
        icon: Shield,
        count: 20,
        badge: "Live",
      },
      {
        id: "tesda",
        name: "TESDA",
        description: "Technical education and skills development programs.",
        href: "/organizations/tesda",
        icon: GraduationCap,
        badge: "Coming soon",
      },
    ],
  },
]

export const landingCategoriesFlat = landingCategoryGroups.flatMap((g) => g.items)
