"use client"

import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type BlankProps = {
  number: number
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  className?: string
  inputClassName?: string
}

function Blank({ number, value, onChange, onFocus, className, inputClassName }: BlankProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 align-baseline", className)}>
      <span className="font-semibold text-slate-800 dark:text-slate-100">({number})</span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        aria-label={`Answer ${number}`}
        className={cn(
          "h-8 rounded-none border-0 border-b border-slate-800 bg-transparent px-1 text-[15px] shadow-none focus-visible:ring-0 dark:border-slate-200",
          inputClassName,
        )}
      />
    </span>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4 sm:items-start">
      <div className="pt-0.5 text-[15px] font-medium text-slate-800 dark:text-slate-100">{label}</div>
      <div className="min-w-0 text-[15px] leading-8 text-slate-800 dark:text-slate-100">{children}</div>
    </div>
  )
}

export function ListeningLostPropertyForm({
  values,
  onChange,
  onFocusBlank,
  className,
}: {
  values: [string, string, string, string, string]
  onChange: (index: 0 | 1 | 2 | 3 | 4, value: string) => void
  onFocusBlank?: (index: 0 | 1 | 2 | 3 | 4) => void
  className?: string
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="space-y-1 text-[15px] leading-7 text-slate-800 dark:text-slate-100">
        <p>
          Write{" "}
          <strong className="font-bold uppercase tracking-wide">
            NO MORE THAN ONE WORD OR A NUMBER
          </strong>{" "}
          for each answer.
        </p>
        <p className="pt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Questions 1 – 5
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">Complete the form below.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-border dark:bg-card">
        <div className="border-b border-slate-200 px-4 py-5 text-center sm:px-8 dark:border-border">
          <h2 className="text-base font-bold uppercase tracking-[0.08em] text-slate-900 sm:text-lg dark:text-white">
            Pan Asian Airways
          </h2>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.06em] text-slate-700 sm:text-base dark:text-slate-200">
            Lost Property Report Form
          </p>
        </div>

        <div className="space-y-5 px-4 py-5 sm:px-8 sm:py-6">
          <div className="inline-grid max-w-full grid-cols-[auto_auto] gap-x-6 gap-y-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-border">
            <span className="font-medium text-slate-700 dark:text-slate-200">Example</span>
            <span className="italic text-slate-500">Answer</span>
            <span className="text-slate-800 dark:text-slate-100">First Name</span>
            <span className="font-bold text-slate-900 dark:text-white">Kirsty</span>
          </div>

          <div className="space-y-4">
            <Row label="Surname">
              <span>Allen</span>
            </Row>

            <Row label="Address">
              <div className="space-y-1">
                <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                  <Blank
                    number={1}
                    value={values[0]}
                    onChange={(v) => onChange(0, v)}
                    onFocus={() => onFocusBlank?.(0)}
                    inputClassName="w-24 sm:w-32"
                  />
                  <span>Windham Road</span>
                </div>
                <div>Richmond</div>
              </div>
            </Row>

            <Row label="Postcode">
              <Blank
                number={2}
                value={values[1]}
                onChange={(v) => onChange(1, v)}
                onFocus={() => onFocusBlank?.(1)}
                inputClassName="w-28 sm:w-40"
              />
            </Row>

            <Row label="Home tel.">
              <span>020 8927 7651</span>
            </Row>

            <Row label="Mobile tel.">
              <Blank
                number={3}
                value={values[2]}
                onChange={(v) => onChange(2, v)}
                onFocus={() => onFocusBlank?.(2)}
                inputClassName="w-36 sm:w-48"
              />
            </Row>

            <Row label="Flight Number">
              <Blank
                number={4}
                value={values[3]}
                onChange={(v) => onChange(3, v)}
                onFocus={() => onFocusBlank?.(3)}
                inputClassName="w-28 sm:w-36"
              />
            </Row>

            <Row label="Seat Number">
              <Blank
                number={5}
                value={values[4]}
                onChange={(v) => onChange(4, v)}
                onFocus={() => onFocusBlank?.(4)}
                inputClassName="w-20 sm:w-28"
              />
            </Row>

            <Row label="From">
              <span>New York</span>
            </Row>

            <Row label="To">
              <span>London Heathrow</span>
            </Row>
          </div>
        </div>

        <p className="border-t border-slate-200 py-3 text-center text-xs text-slate-500 dark:border-border dark:text-slate-400">
          Page 1
        </p>
      </div>
    </section>
  )
}
