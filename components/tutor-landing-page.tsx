"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
} from "lucide-react"
import { SphereXLogo } from "@/components/logo"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { landingCategoryGroups } from "@/lib/landing-categories"
import { LandingCourses } from "@/components/landing/landing-courses"
import { apiGet } from "@/lib/api"

const stats = [
  { value: "25+", label: "Expert Instructors" },
  { value: "5.6k+", label: "Student Reviews" },
  { value: "170+", label: "Courses Available" },
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

export default function TutorLandingPage() {
  const [courseCount, setCourseCount] = useState<number | null>(null)

  useEffect(() => {
    apiGet<{ courses: unknown[] }>("/courses")
      .then((data) => setCourseCount(data.courses?.length ?? 0))
      .catch(() => setCourseCount(0))
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-background dark:text-foreground">
      <LandingHeader />

      {/* ── Hero ── */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-rose-50/60 to-white pb-20 pt-28 dark:from-background dark:via-orange-950/20 dark:to-background"
      >
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-500/10" />
        <div className="pointer-events-none absolute -left-10 bottom-10 h-56 w-56 rounded-full bg-orange-200/40 blur-3xl dark:bg-orange-500/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-8">
          <div>
            <span className="inline-flex items-center rounded-full bg-orange-100 px-4 py-1.5 text-xs font-semibold text-orange-600 dark:bg-orange-950/50 dark:text-orange-300">
              Learn from today
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] dark:text-white">
              Smart Learning Deeper &amp; More{" "}
              <span className="text-orange-500">— Amazing</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-300">
              SphereX hosts self-paced e-learning, exam reviews (NLE, Civil Service), IELTS prep,
              and organization-specific catalogs for professional training and development.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register">
                <Button className="h-12 rounded-full bg-teal-600 px-8 text-base text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <img
              src="/hero-image.png"
              alt="Learning progress across laptop and mobile devices"
              className="relative w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── About / Stats ── */}
      <section id="about" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">About Us</span>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
              A multi-organization learning platform — from DOLE-recognized safety programs to board
              exam reviews and language training.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-border dark:bg-card"
              >
                <p className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  {stat.label === "Courses Available"
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

      {/* ── Top Categories ── */}
      <section id="categories" className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            What SphereX Offers
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600 dark:text-slate-300">
            Self-paced e-learning, exam reviews, IELTS, and organization-specific catalogs — courses
            depend on the partner organization.
          </p>

          <div className="mt-6 space-y-5 sm:mt-8">
            {landingCategoryGroups.map((group) => (
              <div key={group.id}>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.label}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {group.items.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <Link
                        key={cat.id}
                        href={cat.href}
                        className={`flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/40 dark:border-border dark:bg-card dark:hover:border-teal-800 dark:hover:bg-teal-950/20 ${
                          group.items.length === 1 ? "sm:col-span-2" : ""
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{cat.name}</p>
                            {cat.badge && (
                              <Badge variant="secondary" className="h-4 shrink-0 px-1.5 text-[10px] leading-none">
                                {cat.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{cat.description}</p>
                        </div>
                        {cat.count != null && (
                          <span className="shrink-0 text-[11px] font-medium text-teal-600 dark:text-teal-400">
                            {cat.count}+
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Growth / About split ── */}
      <section className="bg-gradient-to-br from-orange-50/50 to-white py-16 dark:from-orange-950/20 dark:to-background">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="relative grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=500&fit=crop"
              alt="Team learning"
              className="col-span-1 row-span-2 h-full w-full rounded-3xl object-cover shadow-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&h=200&fit=crop"
              alt="Workshop"
              className="h-36 w-full rounded-2xl object-cover shadow-md"
            />
            <img
              src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=300&h=200&fit=crop"
              alt="Training session"
              className="h-36 w-full rounded-2xl object-cover shadow-md"
            />
          </div>
          <div>
            <span className="text-sm font-semibold text-orange-500">About Us</span>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl dark:text-white">
              Growth Skills With SphereX Academy &amp; Accelerate Your Better Future
            </h2>
            <p className="mt-5 leading-relaxed text-slate-600 dark:text-slate-300">
              From safety certifications to leadership programs, SphereX gives your team structured
              learning paths, live sessions, and progress tracking — so every learner reaches their
              full potential faster.
            </p>
            <Link href="/register" className="mt-8 inline-block">
              <Button className="rounded-full bg-teal-600 px-8 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            See why we&apos;re rated #1 in online platform training
          </h2>
          <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-10 dark:border-border dark:bg-card">
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-orange-400 text-orange-400" />
              ))}
            </div>
            <blockquote className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              &ldquo;SphereX transformed how our team completes safety certifications. The platform
              is intuitive, the content is top-notch, and tracking progress across departments has
              never been easier.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-slate-50/80 py-16 dark:bg-muted/20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Everything you need to know about enrolling, learning, and teaching on SphereX.
            </p>
          </div>
          <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`item-${i}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white px-4 dark:border-border dark:bg-card"
              >
                <AccordionTrigger className="py-4 text-left font-semibold text-slate-800 hover:no-underline dark:text-foreground">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-slate-600 dark:text-slate-300">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Teach / Learn CTA ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white">What Are You Looking For?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-sm dark:border-border dark:bg-card">
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Do You Want to Teach Here?</h3>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Share your expertise, create courses, and evaluate learners on our teacher portal.
              </p>
              <Link href="/login" className="mt-6 inline-block">
                <Button variant="outline" className="rounded-full px-8 dark:border-border dark:bg-transparent dark:hover:bg-muted">
                  Start Teaching
                </Button>
              </Link>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-600 p-10 text-white shadow-lg">
              <h3 className="text-2xl font-extrabold">Do You Want to Learn Here?</h3>
              <p className="mt-3 text-teal-50">
                Access courses, materials, and live sessions — start your learning journey today.
              </p>
              <Link href="/register" className="mt-6 inline-block">
                <Button className="rounded-full bg-white px-8 text-teal-700 hover:bg-teal-50">
                  Start Learning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="bg-gradient-to-b from-orange-50/60 to-rose-50/40 pt-16 dark:from-background dark:to-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <SphereXLogo className="h-9 w-auto" />
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Sphere<span className="text-teal-600 dark:text-teal-400">X</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Professional training and e-learning platform by Petrosphere — empowering teams
                with skills that matter.
              </p>
              <div className="mt-5 flex gap-3">
                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-teal-300 hover:text-teal-600 dark:border-border dark:bg-card dark:text-slate-400 dark:hover:border-teal-700 dark:hover:text-teal-400"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Company</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                {["About Us", "Our Courses", "Instructors", "Blog", "Careers"].map((item) => (
                  <li key={item}>
                    <a href="#" className="transition hover:text-teal-600 dark:hover:text-teal-400">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Information</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                {["Privacy Policy", "Terms & Conditions", "FAQ", "Support Center"].map((item) => (
                  <li key={item}>
                    <a href="#" className="transition hover:text-teal-600 dark:hover:text-teal-400">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Contact Us</h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
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

          <div className="mt-12 border-t border-slate-200/80 py-6 text-center text-sm text-slate-500 dark:border-border dark:text-slate-400">
            © {new Date().getFullYear()} SphereX LMS · Petrosphere Training. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
