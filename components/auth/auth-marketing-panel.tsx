import { BookOpen, Headphones, ShieldCheck } from "lucide-react"

type AuthMarketingPanelProps = {
  badge?: string
  title: string
}

export function AuthMarketingPanel({
  badge = "Secure LMS access",
  title,
}: AuthMarketingPanelProps) {
  return (
    <section className="relative hidden min-h-full overflow-hidden bg-[#fbfbfb] p-6 lg:block lg:p-8">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -right-16 top-10 h-64 w-64 rounded-full bg-[#FF4B1A]/10 blur-3xl" />
        <div className="absolute bottom-20 left-0 h-56 w-56 rounded-full bg-[#FFE4C8]/50 blur-3xl" />
      </div>

      <div className="relative flex h-full flex-col justify-between rounded-[1.75rem] border border-neutral-200/80 bg-white px-7 py-9 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            PetroCademia
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FFE8E0] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF4B1A]">
            <ShieldCheck className="h-3.5 w-3.5" />
            {badge}
          </div>
        </div>

        <div className="relative mt-8 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <img
              src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80"
              alt="Study notes"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
            />
            <div className="grid gap-3">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
                alt="Learners collaborating"
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
              <div className="rounded-2xl bg-[#FFF4EF] p-4 ring-1 ring-[#FFD8C8]">
                <div className="flex items-center gap-2 text-[#FF4B1A]">
                  <BookOpen className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]">Courses</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-neutral-950">E-Learning paths</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">Self-paced lessons with progress tracking.</p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-3 left-3 right-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] sm:left-6 sm:right-auto sm:w-[15.5rem]">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFE8E0] text-[#FF4B1A]">
                <Headphones className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-950">Course progress</p>
                <p className="text-[11px] text-neutral-500">18 lessons active</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full w-[78%] rounded-full bg-[#FF4B1A]" />
              </div>
              <span className="text-xs font-bold text-[#FF4B1A]">78%</span>
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Courses · IELTS · Reviewers
          </p>
          <h2 className="mt-3 text-[1.85rem] font-extrabold leading-[1.15] tracking-[-0.04em] text-neutral-950">
            {title}
          </h2>
        </div>
      </div>
    </section>
  )
}
