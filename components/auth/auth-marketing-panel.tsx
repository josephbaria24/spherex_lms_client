import { GraduationCap, ShieldCheck, Users } from "lucide-react"
import { LmsIllustration } from "@/components/auth/lms-illustration"

type AuthMarketingPanelProps = {
  badge?: string
  title: string
}

export function AuthMarketingPanel({
  badge = "Secure LMS Access",
  title,
}: AuthMarketingPanelProps) {
  return (
    <section className="relative hidden min-h-full bg-[#f4fbf4] p-8 lg:block">
      <div className="flex h-full flex-col justify-between rounded-[2rem] bg-[#f5fbf3] px-8 py-10">
        <div className="flex justify-end">
          <div className="flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-xs font-semibold text-teal-700 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            {badge}
          </div>
        </div>

        <div className="relative mx-auto mt-4 flex w-full max-w-[31rem] flex-1 items-center justify-center">
          <div className="absolute left-2 top-16 flex h-16 w-16 items-center justify-center rounded-full border border-teal-200 bg-white shadow-sm">
            <Users className="h-7 w-7 text-teal-700" />
          </div>
          <div className="absolute right-3 top-48 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm">
            <GraduationCap className="h-7 w-7 text-emerald-700" />
          </div>
          <div className="absolute bottom-28 left-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,0.1)]">
            <p className="text-sm font-bold text-slate-950">Course progress</p>
            <p className="mt-1 text-xs text-slate-500">18 lessons active</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[78%] rounded-full bg-teal-500" />
              </div>
              <span className="text-xs font-bold text-teal-700">78%</span>
            </div>
          </div>
          <LmsIllustration />
        </div>

        <div className="mx-auto max-w-lg text-center">
          <div className="mb-7 flex justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="h-2 w-7 rounded-full bg-slate-950" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
          </div>
          <h2 className="text-3xl font-semibold leading-snug text-slate-950">{title}</h2>
        </div>
      </div>
    </section>
  )
}
