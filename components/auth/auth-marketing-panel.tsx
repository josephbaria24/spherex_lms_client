import { LmsIllustration } from "@/components/auth/lms-illustration"

type AuthMarketingPanelProps = {
  title: string
  subtitle?: string
}

export function AuthMarketingPanel({ title, subtitle }: AuthMarketingPanelProps) {
  return (
    <section className="relative hidden min-h-full flex-col justify-center bg-[#f4fbf4] px-8 py-12 lg:flex lg:px-10">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 text-center">
        <LmsIllustration />
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            SphereX Learning
          </p>
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-[1.75rem]">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-sm leading-relaxed text-slate-600">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
