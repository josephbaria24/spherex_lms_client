"use client"

import Link from "next/link"
import { LandingHeader } from "@/components/landing/landing-header"
import {
  Play,
  Search,
  ChevronDown,
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { landingCategoryGroups, petrosphereCourses } from "@/lib/landing-categories"

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
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <LandingHeader />

      {/* ── Hero ── */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-rose-50/60 to-white pb-20 pt-28"
      >
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-10 h-56 w-56 rounded-full bg-orange-200/40 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-8">
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
              <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
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
      </section>

      {/* ── About / Stats ── */}
      <section id="about" className="py-16">
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

      {/* ── Explore Courses ── */}
      <section id="courses" className="bg-slate-50/80 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-extrabold text-slate-900">Explore Our Courses</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search courses…" className="w-48 rounded-full pl-9 sm:w-56" />
              </div>
              <button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                All Category <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Featured from{" "}
            <Link href="/organizations/petrosphere" className="text-teal-600 hover:underline">
              Petrosphere
            </Link>{" "}
            — more catalogs coming from partner organizations.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {petrosphereCourses.map((course) => (
              <article
                key={course.title}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                    {course.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-2 font-bold text-slate-900">{course.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{course.lessons} lessons</p>
                  <div className="mt-3 flex items-center gap-2">
                    <img src={petrosphereAvatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                    <span className="text-sm text-slate-500">{course.instructor}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-500">{course.price}</span>
                    <Link href="/login">
                      <Button size="sm" variant="outline" className="rounded-full">
                        Enroll
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/organizations/petrosphere">
              <Button variant="outline" className="rounded-full">Petrosphere Catalog</Button>
            </Link>
            <Link href="/login">
              <Button className="rounded-full bg-teal-600 px-8 hover:bg-teal-700">View All Courses</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Top Categories ── */}
      <section id="categories" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold text-slate-900">
            What SphereX Offers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Self-paced e-learning, exam reviews, IELTS, and organization-specific catalogs — courses
            depend on the partner organization.
          </p>

          <div className="mt-12 space-y-10">
            {landingCategoryGroups.map((group) => (
              <div key={group.id}>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <Link
                        key={cat.id}
                        href={cat.href}
                        className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">{cat.name}</p>
                            {cat.badge && (
                              <Badge variant="secondary" className="text-[10px]">
                                {cat.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{cat.description}</p>
                          {cat.count != null && (
                            <p className="mt-1 text-xs text-teal-600">{cat.count}+ courses</p>
                          )}
                        </div>
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
      <section className="bg-gradient-to-br from-orange-50/50 to-white py-16">
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
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              Growth Skills With SphereX Academy &amp; Accelerate Your Better Future
            </h2>
            <p className="mt-5 leading-relaxed text-slate-600">
              From safety certifications to leadership programs, SphereX gives your team structured
              learning paths, live sessions, and progress tracking — so every learner reaches their
              full potential faster.
            </p>
            <Link href="/register" className="mt-8 inline-block">
              <Button className="rounded-full bg-teal-600 px-8 hover:bg-teal-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold text-slate-900">
            See why we&apos;re rated #1 in online platform training
          </h2>
          <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-10">
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-orange-400 text-orange-400" />
              ))}
            </div>
            <blockquote className="mt-6 text-lg leading-relaxed text-slate-600">
              &ldquo;SphereX transformed how our team completes safety certifications. The platform
              is intuitive, the content is top-notch, and tracking progress across departments has
              never been easier.&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center justify-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
                alt="Reviewer"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="text-left">
                <p className="font-bold text-slate-900">Carlos Mendoza</p>
                <p className="text-sm text-slate-500">HSE Manager, Energy Sector</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-slate-50/80 py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-4 text-slate-600">
              Everything you need to know about enrolling, learning, and teaching on SphereX.
            </p>
          </div>
          <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`item-${i}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white px-4"
              >
                <AccordionTrigger className="py-4 text-left font-semibold text-slate-800 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-slate-600">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Teach / Learn CTA ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold text-slate-900">What Are You Looking For?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-sm">
              <h3 className="text-2xl font-extrabold text-slate-900">Do You Want to Teach Here?</h3>
              <p className="mt-3 text-slate-600">
                Share your expertise, create courses, and evaluate learners on our teacher portal.
              </p>
              <Link href="/login" className="mt-6 inline-block">
                <Button variant="outline" className="rounded-full px-8">
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
      <footer id="contact" className="bg-gradient-to-b from-orange-50/60 to-rose-50/40 pt-16">
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
  )
}
