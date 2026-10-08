"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Check, Copy } from "lucide-react"
import { SphereXLogo } from "@/components/logo"

const sampleUsers = [
  { label: "Admin", email: "admin@spherex.local", password: "Admin123!" },
  { label: "Org admin", email: "orgadmin@petrosphere.local", password: "OrgAdmin123!" },
  { label: "Teacher", email: "teacher@spherex.local", password: "Teacher123!" },
  { label: "New teacher", email: "newteacher@spherex.local", password: "Teacher123!" },
  { label: "Student", email: "student@spherex.local", password: "Student123!" },
  { label: "New student", email: "newstudent@spherex.local", password: "Student123!" },
]

export default function AccountsPage() {
  const [copied, setCopied] = useState<string | null>(null)

  async function copyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#e7e7e7] p-4 text-slate-950 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/login"
          className="mb-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <div className="rounded-[14px] border border-black/5 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="flex items-center gap-3">
            <SphereXLogo className="h-9 w-auto" priority />
            <div className="h-8 w-px bg-slate-200" />
            <p className="text-xs font-semibold uppercase text-teal-700">SphereX LMS</p>
          </div>

          <h1 className="mt-8 text-3xl font-bold text-slate-950">Sample accounts</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Copy an email and password, then type them into the sign-in form yourself.
          </p>

          {process.env.NODE_ENV === "production" ? (
            <p className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Sample accounts are hidden in production.
            </p>
          ) : (
            <div className="mt-8 grid gap-3">
              {sampleUsers.map((sample) => (
                <article key={sample.email} className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">{sample.label}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Credential
                      label="Email"
                      value={sample.email}
                      copied={copied === `${sample.email}:email`}
                      onCopy={() => void copyValue(`${sample.email}:email`, sample.email)}
                    />
                    <Credential
                      label="Password"
                      value={sample.password}
                      copied={copied === `${sample.email}:password`}
                      onCopy={() => void copyValue(`${sample.email}:password`, sample.password)}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Credential({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate font-mono text-xs text-slate-700">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-50"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}
