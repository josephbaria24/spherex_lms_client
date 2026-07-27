"use client"

import Link from "next/link"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingSmoothScroll } from "@/components/landing/landing-smooth-scroll"
import { ExploreCoursesSection } from "@/components/landing/explore-courses-section"
import { WhatSphereXOffersSection } from "@/components/landing/what-spherex-offers-section"
import { AboutJourneySection } from "@/components/landing/about-journey-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import {
  ChevronDown,
  Play,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"
import { SphereXLogo } from "@/components/logo"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  PlayCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { smoothScrollToSection } from "@/lib/landing-smooth-scroll"

const stats = [
  { value: "25+", label: "Expert Instructors" },
  { value: "5.6k+", label: "Student Reviews" },
  { value: "170+", label: "Courses Available" },
]

const petrosphereAvatar =
  "https://elearning.petrosphere.com.ph/wp-content/uploads/2020/10/BLS-Course-2-624x468.png"

const faqs = [
  {
    q: "How do I enroll in a course?",
    a: (
      <>
        Create a free account, browse our course catalog, and click Enroll on any course. You&apos;ll
        get instant access to materials and can track your progress from your dashboard. For
        organization catalogs, ask your admin for an invite or visit the{" "}
        <Link href="/organizations" className="text-sky-600 underline underline-offset-2 hover:text-sky-700">
          Organizations
        </Link>{" "}
        page.
      </>
    ),
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
    a: (
      <>
        If you&apos;re a qualified professional, apply through our teacher portal. Once approved, you
        can create courses, upload lessons, and evaluate students. Start from the{" "}
        <Link href="/login" className="text-sky-600 underline underline-offset-2 hover:text-sky-700">
          login page
        </Link>
        .
      </>
    ),
  },
  {
    q: "What payment methods are accepted?",
    a: "Corporate accounts and enterprise billing are supported. Contact our team for training packages tailored to your organization.",
  },
]

export default function TutorLandingPage() {
  return (
    <LandingSmoothScroll>
    <div className="min-h-screen bg-white text-slate-800">
      <LandingHeader />

      {/* ── Hero ── */}
      <section
        id="home"
        className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-orange-50 via-rose-50/60 to-white pb-24 pt-28"
      >
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-10 h-56 w-56 rounded-full bg-orange-200/40 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="inline-flex items-center rounded-full bg-orange-100 px-4 py-1.5 text-xs font-semibold text-orange-600">
              Learn from today
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
              Smart Learning Deeper &amp; More{" "}
              <span className="text-orange-500">— Amazing</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">
              SphereX hosts self-paced e-learning, exam reviews (NLE, Civil Service), IELTS prep,
              and organization-specific catalogs — starting with{" "}
              <Link href="/organizations/petrosphere" className="font-medium text-teal-600 hover:underline">
                Petrosphere
              </Link>{" "}
              HSE training migrating from the{" "}
              <a
                href="https://elearning.petrosphere.com.ph/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-teal-600 hover:underline"
              >
                Petrosphere eLearning Academy
              </a>
              .
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register">
                <Button className="h-12 rounded-full bg-teal-600 px-8 text-base hover:bg-teal-700">
                  Get Started
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => smoothScrollToSection("courses")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white">
                  <Play className="h-3.5 w-3.5 fill-white" />
                </span>
                Watch Video
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -left-4 top-8 h-16 w-16 rounded-2xl bg-teal-500/90 shadow-lg" />
            <div className="absolute right-8 top-4 h-10 w-10 rounded-full bg-orange-400 shadow-md" />
            <div className="absolute bottom-12 left-8 h-8 w-8 rounded-lg bg-teal-300/80" />
            <img
              src="/hero-image.png"
              alt="Learning progress across laptop and mobile devices"
              className="relative w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => smoothScrollToSection("about")}
          aria-label="Scroll to next section"
          className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-slate-500 transition hover:text-teal-600"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Explore</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </section>

      {/* ── About / Stats ── */}
      <section id="about" className="scroll-mt-24 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold text-teal-600">About Us</span>
            <p className="mt-3 text-lg text-slate-600">
              A multi-organization learning platform — from DOLE-recognized safety programs to board
              exam reviews and language training.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm"
              >
                <p className="text-4xl font-extrabold text-slate-900">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ExploreCoursesSection />

      <WhatSphereXOffersSection />

      <AboutJourneySection />

      <TestimonialsSection />

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Frequently-asked questions
          </h2>

          <Accordion
            type="single"
            collapsible
            defaultValue="item-0"
            className="mt-10 border-t border-slate-200"
          >
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`item-${i}`}
                className="border-b border-slate-200 last:border-b"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-slate-900 hover:no-underline focus-visible:ring-0 [&>svg]:size-5 [&>svg]:text-slate-400">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-[15px] leading-relaxed text-slate-700">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Teach / Learn CTA ── */}
      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-teal-700">
              Two ways to use SphereX
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              What are you looking for?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Whether you build courses or take them, SphereX gives you a clear place to start.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
            {/* Teach */}
            <div className="group flex flex-col rounded-[1.75rem] border border-slate-200/90 bg-white p-8 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.4)] sm:p-10">
              <div className="flex items-start justify-between gap-4">
                <AcademicCapIcon className="h-8 w-8 text-orange-600" />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Instructors
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-bold tracking-tight text-slate-900">
                Teach on SphereX
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                Build your classroom online — publish courses, manage sessions, and evaluate
                learners from one teacher workspace.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  { icon: BookOpenIcon, text: "Create and organize course content" },
                  { icon: ClipboardDocumentCheckIcon, text: "Track evaluations and progress" },
                  { icon: UsersIcon, text: "Guide students across your organization" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-[14px] text-slate-700">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className="mt-8 inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start teaching
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Learn */}
            <div className="group flex flex-col rounded-[1.75rem] border border-slate-200/90 bg-white p-8 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.4)] sm:p-10">
              <div className="flex items-start justify-between gap-4">
                <BookOpenIcon className="h-8 w-8 text-teal-700" />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Learners
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-bold tracking-tight text-slate-900">
                Learn on SphereX
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                Jump into self-paced courses, exam prep, and organization catalogs — with progress
                that stays with you.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  { icon: PlayCircleIcon, text: "Self-paced lessons and live sessions" },
                  { icon: CheckCircleIcon, text: "Certificates and completion tracking" },
                  { icon: UsersIcon, text: "Join org-specific training catalogs" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-[14px] text-slate-700">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="mt-8 inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start learning
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="scroll-mt-24 bg-gradient-to-b from-orange-50/60 to-rose-50/40 pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <SphereXLogo className="h-9 w-auto" />
                <span className="text-lg font-extrabold text-slate-900">
                  Sphere<span className="text-teal-600">X</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Professional training and e-learning platform by Petrosphere — empowering teams
                with skills that matter.
              </p>
              <div className="mt-5 flex gap-3">
                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-teal-300 hover:text-teal-600"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900">Company</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                {["About Us", "Our Courses", "Instructors", "Blog", "Careers"].map((item) => (
                  <li key={item}>
                    <a href="#" className="transition hover:text-teal-600">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900">Information</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                {["Privacy Policy", "Terms & Conditions", "FAQ", "Support Center"].map((item) => (
                  <li key={item}>
                    <a href="#" className="transition hover:text-teal-600">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900">Contact Us</h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  Metro Manila, Philippines
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-teal-600" />
                  +63 2 1234 5678
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-teal-600" />
                  training@petrosphere.com.ph
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-200/80 py-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} SphereX LMS · Petrosphere Training. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
    </LandingSmoothScroll>
  )
}
