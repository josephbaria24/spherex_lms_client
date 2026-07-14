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
        href: "/#courses",
        icon: MonitorPlay,
        count: 120,
      },
      {
        id: "blended",
        name: "Blended & Instructor-Led",
        description: "Online modules plus live skills sessions and evaluations.",
        href: "/#courses",
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
        href: "/#courses",
        icon: Stethoscope,
      },
      {
        id: "cse",
        name: "Civil Service Exam Review",
        description: "CSE prep for professional and sub-professional levels.",
        href: "/#courses",
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
        href: "/#courses",
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

export const petrosphereCourses = [
  {
    title: "COVID-19 Awareness and Prevention",
    lessons: 2,
    category: "Free",
    instructor: "Harthwell",
    price: "Free",
    image: "https://images.unsplash.com/photo-1584036561561-d783331ee903?w=600&h=400&fit=crop",
  },
  {
    title: "Basic Life Support Training",
    lessons: 14,
    category: "Blended",
    instructor: "Petrosphere",
    price: "Paid",
    image: "https://elearning.petrosphere.com.ph/wp-content/uploads/2020/10/BLS-Course-2-624x468.png",
  },
  {
    title: "Advanced Cardiovascular Life Support",
    lessons: 7,
    category: "Blended",
    instructor: "Petrosphere",
    price: "Paid",
    image: "https://elearning.petrosphere.com.ph/wp-content/uploads/2020/10/ACLS-Course-1.png",
  },
  {
    title: "Basic First Aid Training",
    lessons: 6,
    category: "Blended",
    instructor: "Petrosphere",
    price: "Paid",
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=600&h=400&fit=crop",
  },
  {
    title: "Basic Electrical Safety",
    lessons: 4,
    category: "Online",
    instructor: "Ken Gilmer",
    price: "Paid",
    image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&h=400&fit=crop",
  },
  {
    title: "Mandatory Eight-Hour Safety Training",
    lessons: 6,
    category: "Blended",
    instructor: "Ken Gilmer",
    price: "Paid",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop",
  },
]
