"use client"

import type { LucideIcon } from "lucide-react"
import {
  Award,
  BarChart3,
  Globe2,
  HandHelping,
  Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"

type JourneyStep = {
  title: string
  description: string
  image: string
  imageAlt: string
  icon: LucideIcon
  imageLeft: boolean
}

const steps: JourneyStep[] = [
  {
    title: "From Humble Beginnings",
    description:
      "SphereX started with a simple goal — make professional training easier to deliver, track, and trust. What began as partner-led safety programs grew into a platform built for modern learning teams.",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&h=700&fit=crop",
    imageAlt: "Instructor preparing training materials",
    icon: HandHelping,
    imageLeft: true,
  },
  {
    title: "Milestones and Achievements",
    description:
      "We expanded into structured e-learning, live sessions, and certification workflows — helping organizations move from scattered training files to one measurable learning system.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=700&fit=crop",
    imageAlt: "Team collaborating on learning programs",
    icon: Award,
    imageLeft: false,
  },
  {
    title: "Innovation and Growth",
    description:
      "Self-paced modules, blended instruction, and exam reviews came together under SphereX — so learners can progress at their pace while organizations keep quality consistent.",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&h=700&fit=crop",
    imageAlt: "Hands working on a laptop during training",
    icon: BarChart3,
    imageLeft: true,
  },
  {
    title: "Our Partner Network",
    description:
      "From Petrosphere HSE catalogs to upcoming TESDA programs, SphereX connects partner organizations under one multi-organization learning experience.",
    image:
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&h=700&fit=crop",
    imageAlt: "Classroom training session",
    icon: Globe2,
    imageLeft: false,
  },
  {
    title: "Looking Ahead",
    description:
      "We’re building toward smarter pathways, stronger reporting, and more partner catalogs — so every team can elevate skills with confidence and clarity.",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&h=700&fit=crop",
    imageAlt: "Professionals focused on future skills",
    icon: Lightbulb,
    imageLeft: true,
  },
]

function JourneyRow({ step }: { step: JourneyStep }) {
  const Icon = step.icon

  return (
    <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
      {/* Image with serpentine frame */}
      <div className={cn("relative", step.imageLeft ? "lg:order-1" : "lg:order-2")}>
        <div
          className={cn(
            "relative",
            step.imageLeft ? "lg:pl-7 lg:pt-7 lg:pb-7" : "lg:pr-7 lg:pt-7 lg:pb-7",
          )}
        >
          {/* Thick teal path hugging the outer edge of the image */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 hidden w-7 rounded-[2.25rem] bg-[#0f766e] lg:block",
              step.imageLeft ? "left-0" : "right-0",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-0 right-0 top-0 hidden h-7 rounded-t-[2.25rem] bg-[#0f766e] lg:block",
              step.imageLeft ? "rounded-tr-none" : "rounded-tl-none",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute bottom-0 left-0 right-0 hidden h-7 rounded-b-[2.25rem] bg-[#0f766e] lg:block",
              step.imageLeft ? "rounded-br-none" : "rounded-bl-none",
            )}
          />

          <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-100 shadow-sm">
            <img
              src={step.image}
              alt={step.imageAlt}
              className="aspect-[5/4] w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Copy */}
      <div
        className={cn(
          "relative max-w-md",
          step.imageLeft ? "lg:order-2" : "lg:order-1 lg:ml-auto",
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3ebe0] text-slate-700">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
          {step.title}
        </h3>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-500">{step.description}</p>
      </div>
    </div>
  )
}

function Connector({ fromLeft }: { fromLeft: boolean }) {
  return (
    <div className="relative hidden h-24 lg:block" aria-hidden>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 96"
        fill="none"
        preserveAspectRatio="none"
      >
        {fromLeft ? (
          // left image → right image (curve across center)
          <path
            d="M 55 0 L 55 28 Q 55 48 75 48 L 925 48 Q 945 48 945 68 L 945 96"
            stroke="#0f766e"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          // right image → left image
          <path
            d="M 945 0 L 945 28 Q 945 48 925 48 L 75 48 Q 55 48 55 68 L 55 96"
            stroke="#0f766e"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  )
}

export function AboutJourneySection() {
  return (
    <section id="about-story" className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-slate-500">SphereX Journey</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            The SphereX Journey Story
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
            From early training programs to a multi-organization learning platform — this is how
            SphereX grew into a system teams rely on for skills, safety, and certification.
          </p>
        </div>

        <div className="mt-14 space-y-4 sm:mt-16 lg:mt-20 lg:space-y-0">
          {steps.map((step, index) => (
            <div key={step.title}>
              <JourneyRow step={step} />
              {index < steps.length - 1 ? (
                <Connector fromLeft={step.imageLeft} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
