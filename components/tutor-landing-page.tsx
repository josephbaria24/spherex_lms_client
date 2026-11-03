"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Inter } from "next/font/google"
import { LandingHeader } from "@/components/landing/landing-header"
import {
  Star,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react"
import {
  HiArrowRight,
  HiBookOpen,
  HiHeadphones,
  HiMic,
  HiPen,
} from "@/components/icons/hugeicons"
import { SphereXLogo } from "@/components/logo"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { landingCategoryGroups } from "@/lib/landing-categories"
import { LandingCourses } from "@/components/landing/landing-courses"
import { apiGet } from "@/lib/api"
import { cn } from "@/lib/utils"

const display = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-landing-display",
  display: "swap",
})

const stats = [
  { value: "25+", label: "Expert instructors" },
  { value: "5.6k+", label: "Learner reviews" },
  { value: "170+", label: "Courses available" },
]

const courseStructure = [
  {
    skill: "Listening",
    title: "Train your ear",
    desc: "Form completion, conversations, and timed audio drills.",
    href: "/ielts",
    icon: HiHeadphones,
    tone: "bg-white text-neutral-950 ring-neutral-200 dark:bg-card dark:text-foreground dark:ring-border",
    step: "01",
  },
  {
    skill: "Reading",
    title: "Read with purpose",
    desc: "Academic passages, shared panels, and band-style scoring.",
    href: "/ielts",
    icon: HiBookOpen,
    tone: "bg-white text-neutral-950 ring-neutral-200 dark:bg-card dark:text-foreground dark:ring-border",
    step: "02",
  },
  {
    skill: "Writing",
    title: "Write for the band",
    desc: "Task practice coming soon — structure first, then polish.",
    href: "/ielts",
    icon: HiPen,
    tone: "bg-white text-neutral-950 ring-neutral-200 dark:bg-card dark:text-foreground dark:ring-border",
    step: "03",
  },
  {
    skill: "Speaking",
    title: "Speak with clarity",
    desc: "Part 1–3 speaking practice coming soon.",
    href: "/ielts",
    icon: HiMic,
    tone: "bg-white text-neutral-950 ring-neutral-200 dark:bg-card dark:text-foreground dark:ring-border",
    step: "04",
  },
]

const faqs = [
  {
    q: "How do I enroll in a course?",
    a: "Create a free account, browse our course catalog, and click Enroll on any course. You'll get instant access to materials and can track your progress from your dashboard.",
  },
  {
    q: "Are the courses certified?",
    a: "Many Petrosphere courses include industry-recognized certifications upon completion. Each course page lists certification details and requirements.",
  },
  {
    q: "Can I learn at my own pace?",
    a: "Yes. Most courses are self-paced with optional live training sessions. You can pause, resume, and revisit lessons anytime.",
  },
  {
    q: "How do I become an instructor?",
    a: "If you're a qualified professional, apply through our teacher portal. Once approved, you can create courses, upload lessons, and evaluate students.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Corporate accounts and enterprise billing are supported. Contact our team for training packages tailored to your organization.",
  },
]

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-slate-200/80 dark:bg-card/80 dark:text-slate-400 dark:ring-border",
        className,
      )}
    >
      {children}
    </span>
  )
}

function DisplayHeading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode
  className?: string
  as?: "h1" | "h2" | "h3"
}) {
  return (
    <Tag
      className={cn(
        "font-[family-name:var(--font-landing-display)] font-extrabold tracking-[-0.045em] text-neutral-950 dark:text-foreground",
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export default function TutorLandingPage() {
  const [courseCount, setCourseCount] = useState<number | null>(null)

  useEffect(() => {
    apiGet<{ courses: unknown[] }>("/courses")
      .then((data) => setCourseCount(data.courses?.length ?? 0))
      .catch(() => setCourseCount(0))
  }, [])

  return (
    <div
      className={cn(
        display.variable,
        display.className,
        "min-h-screen overflow-x-clip bg-[#fbfbfb] text-neutral-950 antialiased dark:bg-background dark:text-foreground",
      )}
    >
      <LandingHeader />

      {/* Hero */}
      <section id="home" className="bg-[#fbfbfb] pb-10 pt-24 sm:pb-14 sm:pt-28 dark:bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-[family-name:var(--font-landing-display)] text-[clamp(2rem,7.4vw,6.15rem)] font-black leading-[0.9] tracking-[-0.055em] text-black dark:text-white">
            Learn with purpose.
            <br />
            <span className="block text-[clamp(1.55rem,4.15vw,3.35rem)] leading-[0.98] tracking-[-0.045em]">
              Courses, IELTS, and reviewers.
            </span>
          </h1>

          <div className="mt-10 grid items-start gap-8 lg:mt-14 lg:grid-cols-[minmax(15rem,18.5rem)_1fr] lg:gap-12">
            <div className="max-w-[16.5rem] pt-1">
              <p className="text-[15px] font-medium leading-[1.45] text-neutral-900 sm:text-base dark:text-neutral-300">
                Courses, IELTS practice, and exam reviewers — structured guidance at every step.
              </p>
              <Link
                href="/courses"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#FF4B1A] px-5 text-[15px] font-semibold text-white transition hover:bg-[#e84314]"
              >
                Explore Courses
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </Link>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
              <img
                src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80"
                alt="Hands writing study notes"
                className="aspect-[4/3] w-full min-w-0 rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/10"
              />
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                alt="Learners studying together"
                className="aspect-[4/3] w-full min-w-0 rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/10"
              />
            </div>
          </div>

          <nav aria-label="IELTS skills" className="mt-12 grid grid-cols-4 sm:mt-16">
            {["Reading", "Writing", "Listening", "Speaking"].map((skill, index) => (
              <Link
                key={skill}
                href="/ielts"
                className="relative px-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-950 transition hover:text-[#FF4B1A] sm:text-[12px] sm:tracking-[0.28em] dark:text-neutral-100 dark:hover:text-[#FF8A6A]"
              >
                {index > 0 && (
                  <span
                    className="absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-neutral-300 dark:bg-border"
                    aria-hidden
                  />
                )}
                {skill}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Course structure — Aven-style modules */}
      <section id="structure" className="pb-20 pt-6 sm:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Course structure</Eyebrow>
            <DisplayHeading className="mt-5 text-balance text-[clamp(1.7rem,4vw,3.25rem)] leading-[1.1]">
              Four skills. One clear path.
            </DisplayHeading>
            <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg sm:leading-8 dark:text-slate-400">
              Practice IELTS the way the test is built — Listening, Reading, Writing, and Speaking —
              with soft focus cards and room to breathe.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:gap-5">
            {courseStructure.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.skill}
                  href={item.href}
                  className={cn(
                    "group relative overflow-hidden rounded-[1.75rem] p-6 ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-28px_rgba(15,55,70,0.35)] sm:p-8 dark:hover:shadow-[0_20px_50px_-28px_rgba(0,0,0,0.65)]",
                    item.tone,
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-[family-name:var(--font-landing-display)] text-sm font-semibold tracking-[0.12em] text-current/55">
                      {item.step}
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 shadow-sm dark:bg-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-current/60">
                    {item.skill}
                  </p>
                  <DisplayHeading as="h3" className="mt-2 text-[1.65rem] leading-tight text-current sm:text-[1.85rem]">
                    {item.title}
                  </DisplayHeading>
                  <p className="mt-3 max-w-sm text-[15px] leading-7 text-current/75">{item.desc}</p>
                  <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-current">
                    Open practice
                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="about" className="pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,55,70,0.35)] ring-1 ring-slate-200/70 sm:grid-cols-3 sm:p-8 dark:bg-card dark:shadow-none dark:ring-border">
            {stats.map((stat) => (
              <div key={stat.label} className="px-2 py-4 text-center sm:py-2">
                <p className="font-[family-name:var(--font-landing-display)] text-[2.5rem] font-semibold tracking-[-0.04em] text-slate-900 sm:text-5xl dark:text-white">
                  {stat.label === "Courses available"
                    ? courseCount === null
                      ? "—"
                      : courseCount
                    : stat.value}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingCourses />

      {/* Categories */}
      <section id="categories" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>What PetroCademia offers</Eyebrow>
            <DisplayHeading className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.12]">
              Learning formats for every path
            </DisplayHeading>
            <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg dark:text-slate-400">
              From safety certifications to board reviews and language prep — organized by how you
              learn.
            </p>
          </div>

          <div className="mt-12 space-y-8">
            {landingCategoryGroups.map((group) => (
              <div key={group.id}>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {group.label}
                </h3>
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                  {group.items.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <Link
                        key={cat.id}
                        href={cat.href}
                        className={cn(
                          "flex min-w-0 items-center gap-4 rounded-[1.35rem] bg-white px-5 py-4 ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-card dark:ring-border dark:hover:shadow-black/40",
                          group.items.length === 1 && "sm:col-span-2",
                        )}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFE8E0] text-[#FF4B1A] dark:bg-[#FF4B1A]/15">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-[family-name:var(--font-landing-display)] text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                            {cat.name}
                          </p>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                            {cat.description}
                          </p>
                        </div>
                        <HiArrowRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth split */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=500&fit=crop"
              alt="Team learning"
              className="col-span-1 row-span-2 h-full min-h-[280px] w-full rounded-[1.75rem] object-cover shadow-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&h=200&fit=crop"
              alt="Workshop"
              className="h-36 w-full rounded-[1.35rem] object-cover shadow-md sm:h-40"
            />
            <img
              src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=300&h=200&fit=crop"
              alt="Training session"
              className="h-36 w-full rounded-[1.35rem] object-cover shadow-md sm:h-40"
            />
          </div>
          <div>
            <Eyebrow className="bg-[#FFF3E6] text-[#9A5B1F] ring-[#F5D9B8]/80 dark:bg-[#FF4B1A]/15 dark:text-[#FF8A6A] dark:ring-[#FF4B1A]/25">
              About us
            </Eyebrow>
            <DisplayHeading className="mt-5 text-[clamp(2rem,4vw,3.1rem)] leading-[1.12]">
              Skills that compound into a better future
            </DisplayHeading>
            <p className="mt-5 text-base leading-8 text-slate-500 sm:text-lg sm:leading-8 dark:text-slate-400">
              From safety certifications to leadership programs, PetroCademia gives your team structured
              learning paths, live sessions, and progress tracking — so every learner moves forward
              with clarity.
            </p>
            <Link href="/register" className="mt-8 inline-block">
              <Button className="h-12 rounded-full bg-[#FF4B1A] px-8 text-[15px] font-semibold text-white hover:bg-[#e84314]">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <DisplayHeading className="text-[clamp(1.85rem,3.5vw,2.75rem)] leading-[1.15]">
            Trusted by teams who take training seriously
          </DisplayHeading>
          <div className="mt-10 rounded-[2rem] bg-white px-8 py-10 shadow-[0_20px_60px_-40px_rgba(15,55,70,0.35)] ring-1 ring-slate-200/70 sm:px-12 dark:bg-card dark:shadow-none dark:ring-border">
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9 dark:text-slate-300">
              &ldquo;PetroCademia transformed how our team completes safety certifications. The platform
              is intuitive, the content is strong, and tracking progress across departments has never
              been easier.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <DisplayHeading className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.12]">
              Questions, answered clearly
            </DisplayHeading>
            <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg dark:text-slate-400">
              Everything you need to know about enrolling, learning, and teaching on PetroCademia.
            </p>
          </div>
          <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`item-${i}`}
                className="overflow-hidden rounded-[1.25rem] border-0 bg-white px-5 ring-1 ring-slate-200/80 dark:bg-card dark:ring-border"
              >
                <AccordionTrigger className="py-5 text-left font-[family-name:var(--font-landing-display)] text-[15px] font-semibold tracking-tight text-slate-900 hover:no-underline sm:text-base dark:text-white">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-7 text-slate-500 dark:text-slate-400">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Teach / Learn */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <DisplayHeading className="text-center text-[clamp(2rem,4vw,3rem)] leading-[1.12]">
            What are you looking for?
          </DisplayHeading>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="rounded-[1.75rem] bg-white p-8 ring-1 ring-slate-200/80 sm:p-10 dark:bg-card dark:ring-border">
              <DisplayHeading as="h3" className="text-2xl sm:text-[1.75rem]">
                Do you want to teach here?
              </DisplayHeading>
              <p className="mt-3 text-[15px] leading-7 text-slate-500 dark:text-slate-400">
                Share your expertise, create courses, and evaluate learners on our teacher portal.
              </p>
              <Link href="/login" className="mt-7 inline-block">
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-slate-200 px-7 font-semibold dark:border-border dark:bg-transparent dark:hover:bg-muted"
                >
                  Start teaching
                </Button>
              </Link>
            </div>
            <div className="rounded-[1.75rem] bg-slate-900 p-8 text-white sm:p-10 dark:bg-[#12151f] dark:ring-1 dark:ring-border">
              <DisplayHeading as="h3" className="text-2xl text-white sm:text-[1.75rem]">
                Do you want to learn here?
              </DisplayHeading>
              <p className="mt-3 text-[15px] leading-7 text-slate-300">
                Access courses, materials, and live sessions — start your learning journey today.
              </p>
              <Link href="/register" className="mt-7 inline-block">
                <Button className="h-11 rounded-full bg-white px-7 font-semibold text-slate-900 hover:bg-slate-100">
                  Start learning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-slate-200/80 bg-white pt-16 dark:border-border dark:bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <SphereXLogo className="h-9 w-auto" ink />
                <span className="font-[family-name:var(--font-landing-display)] text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  Petro<span className="text-[#FF4B1A]">Cademia</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Professional training and e-learning by Petrosphere — empowering teams with skills
                that matter.
              </p>
              <div className="mt-5 flex gap-2.5">
                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F8F6] text-slate-500 ring-1 ring-slate-200/80 transition hover:text-[#FF4B1A] dark:bg-muted dark:text-slate-400 dark:ring-border dark:hover:text-[#FF8A6A]"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-[family-name:var(--font-landing-display)] text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Company
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {["About Us", "Our Courses", "Instructors", "Blog", "Careers"].map((item) => (
                  <li key={item}>
                    <a href="#" className="transition hover:text-[#FF4B1A] dark:hover:text-[#FF8A6A]">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-[family-name:var(--font-landing-display)] text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Information
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {["Privacy Policy", "Terms & Conditions", "FAQ", "Support Center"].map((item) => (
                  <li key={item}>
                    <a href="#" className="transition hover:text-[#FF4B1A] dark:hover:text-[#FF8A6A]">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-[family-name:var(--font-landing-display)] text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Contact us
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4B1A]" />
                  Metro Manila, Philippines
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-[#FF4B1A]" />
                  +63 2 1234 5678
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-[#FF4B1A]" />
                  training@petrosphere.com.ph
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-200/80 py-6 text-center text-sm text-slate-400 dark:border-border">
            © {new Date().getFullYear()} PetroCademia · Petrosphere Training. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
