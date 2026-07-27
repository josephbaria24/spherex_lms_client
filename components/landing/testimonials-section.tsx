"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    quote:
      "Using SphereX has been such a smooth experience. It's clear that a lot of thought went into making safety training user-friendly for our whole team.",
    name: "Diana Mounter",
    role: "Head of Product, Cloud",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "I didn't realize how much we needed a unified learning platform until we started using SphereX. It's well-made, easy to use, and saves our HSE team so much time.",
    name: "Paul Smith",
    role: "Creative Director, Luminous",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "SphereX does everything we hoped for and more. The design is intuitive, and it fits seamlessly into our compliance routine.",
    name: "Tim Williams",
    role: "Founder, Orbitc",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "SphereX transformed how our team completes safety certifications. The platform is intuitive, the content is top-notch, and tracking progress across departments has never been easier.",
    name: "Carlos Mendoza",
    role: "HSE Manager, Energy Sector",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "Our instructors love how simple it is to upload materials and evaluate learners. SphereX finally gave us one place for training and reviews.",
    name: "Maya Chen",
    role: "L&D Lead, Northwind",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "From onboarding to DOLE-required safety modules, SphereX keeps everyone on track. Reporting alone was worth the switch.",
    name: "James Ortega",
    role: "Operations Director, Apex",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "We rolled out Petrosphere courses to multiple sites in weeks. Learners actually finish their modules now.",
    name: "Sofia Reyes",
    role: "Training Coordinator, Harbor Co.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "Clean interface, reliable access, and certifications we can trust. SphereX is our default for workplace learning.",
    name: "Noah Blake",
    role: "Safety Supervisor, Peakline",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote:
      "The blended and self-paced options give our teams flexibility without losing quality. Highly recommend for growing organizations.",
    name: "Ava Lim",
    role: "People Ops Manager, Brightpath",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face",
  },
]

function TestimonialCard({
  quote,
  name,
  role,
  avatar,
}: (typeof testimonials)[number]) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] sm:p-7">
      <p className="flex-1 text-[15px] leading-relaxed text-slate-600">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-6 flex items-center gap-3">
        <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </article>
  )
}

const COLLAPSED_MAX_HEIGHT = 580

export function TestimonialsSection() {
  const [expanded, setExpanded] = useState(false)
  const [fullHeight, setFullHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return

    const measure = () => setFullHeight(el.scrollHeight)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  return (
    <section className="bg-[#f7f7f5] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-orange-500" />
            <span className="text-sm font-medium text-slate-600">Testimonials</span>
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Trusted by the best
            <br className="hidden sm:block" /> in your industry
          </h2>
          <p className="mt-4 text-base text-slate-500 sm:text-lg">
            Find out why our solution is the top choice for fast-growing startups.
          </p>
        </div>

        <div className="relative mt-12 sm:mt-14">
          <div
            className="overflow-hidden transition-[max-height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              maxHeight: expanded
                ? fullHeight || 2400
                : Math.min(COLLAPSED_MAX_HEIGHT, fullHeight || COLLAPSED_MAX_HEIGHT),
            }}
          >
            <div
              ref={contentRef}
              className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {testimonials.map((item) => (
                <TestimonialCard key={item.name} {...item} />
              ))}
            </div>
          </div>

          {/* Fade overlay */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#f7f7f5] via-[#f7f7f5]/85 to-transparent transition-opacity duration-500 ease-out",
              expanded ? "opacity-0" : "opacity-100",
            )}
          />

          <div
            className={cn(
              "flex justify-center transition-all duration-500 ease-out",
              expanded ? "relative mt-8" : "absolute inset-x-0 bottom-0 pb-2",
            )}
          >
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition duration-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
            >
              {expanded ? "Show less" : "Show more"}
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-slate-500 transition-transform duration-500 ease-out",
                  expanded ? "rotate-90" : "rotate-0",
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
