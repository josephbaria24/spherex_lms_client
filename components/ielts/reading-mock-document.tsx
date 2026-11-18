"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type ReadingPassageBlock = {
  number: number
  heading: string
  instruction: string
  title: string
  paragraphs: string[]
  source: string | null
}

export type ReadingDocument = {
  /** e.g. "ACADEMIC READING PRACTICE TEST 2" — shown once above Passage 1 */
  examTitle: string | null
  passages: ReadingPassageBlock[]
}

export type ReadingQuestionItem = {
  index: number
  id: string
  number: number
  statement: string
}

export type ReadingQuestionGroup = {
  key: string
  title: string
  instructions: string[]
  listItems: string[]
  wordBank: string[]
  example: { prompt: string; answer: string } | null
  questions: ReadingQuestionItem[]
}

function isExamBannerLine(line: string) {
  return /^ACADEMIC READING PRACTICE TEST\b/i.test(line)
}

function isPassageTitleLine(line: string) {
  if (!line || line.length < 3) return false
  if (/^questions?\b/i.test(line)) return false
  if (/^you should spend\b/i.test(line)) return false
  if (/^reading passage\b/i.test(line)) return false
  if (isExamBannerLine(line)) return false
  if (/^source:/i.test(line)) return false
  // All-caps article titles (DIABETES, THE BIG CATS, …)
  if (line === line.toUpperCase() && /[A-Z]/.test(line) && line.length <= 80) return true
  // Known Title Case passage names from Academic mocks
  return /^(Contaminating the Arctic|The Story of Coffee|Diabetes|Cleaning up The Thames|Deer Farming In Australia)\b/i.test(
    line,
  )
}

/** Parse shared passage_html into exam banner + Passage 1 / 2 / 3 blocks. */
export function parseReadingDocument(raw: string): ReadingDocument {
  const text = raw.replace(/\r\n/g, "\n").trim()
  if (!text) return { examTitle: null, passages: [] }

  let examTitle: string | null = null
  const bannerMatch = text.match(/^ACADEMIC READING PRACTICE TEST\s+\d+/i)
  if (bannerMatch) examTitle = bannerMatch[0].replace(/\s+/g, " ").toUpperCase()

  // Only split on a passage banner line ("READING PASSAGE N Questions …"), never on
  // wrapped instruction lines like "Reading Passage 1 below."
  const parts = text
    .split(/\n(?=READING PASSAGE\s+\d+\s+Questions?\b)/i)
    .filter((part) => /READING PASSAGE\s+\d+\s+Questions?\b/i.test(part))
  const passages = parts.map((part, idx) => {
    const lines = part
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    const numberMatch = part.match(/READING PASSAGE\s+(\d+)\s+Questions?\b/i)
    const number = numberMatch ? Number(numberMatch[1]) : idx + 1

    let heading = `READING PASSAGE ${number}`
    let instruction = ""
    let title = ""
    const bodyLines: string[] = []
    let source: string | null = null
    let startedBody = false

    for (const line of lines) {
      if (isExamBannerLine(line)) {
        if (!examTitle) examTitle = line.replace(/\s+/g, " ").toUpperCase()
        continue
      }
      if (/^READING PASSAGE\s+\d+/i.test(line)) {
        if (/questions/i.test(line)) heading = line.replace(/\s+/g, " ").toUpperCase()
        continue
      }
      if (/^you should spend about/i.test(line)) {
        instruction = line
        continue
      }
      if (/^source:/i.test(line)) {
        source = line
        continue
      }
      // Question-block headers that leaked into passage_html — stop the article.
      if (startedBody && /^questions?\s+\d+/i.test(line)) break

      if (!title && isPassageTitleLine(line)) {
        title = line
        continue
      }
      startedBody = true
      bodyLines.push(line)
    }

    // Merge soft-wrapped lines into paragraphs (blank-separated already filtered).
    const paragraphs: string[] = []
    let buf = ""
    for (const line of bodyLines) {
      if (/^[A-Z]$/.test(line)) {
        if (buf) paragraphs.push(buf)
        buf = line
        continue
      }
      if (/^[A-Z]\s+\S/.test(line) && line[1] === " ") {
        if (buf) paragraphs.push(buf)
        buf = line
        continue
      }
      buf = buf ? `${buf} ${line}` : line
      // Heuristic: end paragraph on long sentence-ending chunks when next would be new.
      if (buf.length > 420 && /[.!?]"?$/.test(buf)) {
        paragraphs.push(buf)
        buf = ""
      }
    }
    if (buf) paragraphs.push(buf)

    return { number, heading, instruction, title, paragraphs, source }
  })

  return { examTitle, passages }
}

/** Split shared passage_html into Passage 1 / 2 / 3 blocks. */
export function parseReadingPassages(raw: string): ReadingPassageBlock[] {
  return parseReadingDocument(raw).passages
}

function extractQuestionNumber(statement: string, fallback: number) {
  const match = statement.match(/^(\d+)\.\s*/)
  return match ? Number(match[1]) : fallback
}

function stripQuestionNumber(statement: string) {
  return statement.replace(/^\d+\.\s*/, "").trim()
}

/** Bold IELTS keywords / ranges inside instruction copy. */
function ReadingRichText({ text, className }: { text: string; className?: string }) {
  const pattern =
    /(\*\*[^*]+\*\*|\bYES\b|\bNO\b|\bNOT GIVEN\b|\bTRUE\b|\bFALSE\b|\bAnswer:\b|\bExample\b|\bBoxes?\s+\d+\s*[–\-]\s*\d+\b|\bQuestions?\s+\d+\s*[–\-]\s*\d+\b|\bparagraphs?\s+[A-G](?:\s*[–\-]\s*[A-G])?\b|\b\([A-G](?:\s*[–\-]\s*[A-G])?\)|\b\([ivxlcdm]+(?:\s*[–\-]\s*[ivxlcdm]+)?\)|\b[ivxlcdm]+\s*[–\-]\s*[ivxlcdm]+\b|\bA\s*[–\-]\s*D\b|\bA\s*[–\-]\s*G\b)/gi

  const parts: ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = new RegExp(pattern.source, pattern.flags)
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const token = match[0]
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-[#1e1b4b]">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (/^(YES|NO|NOT GIVEN|TRUE|FALSE)$/i.test(token)) {
      parts.push(
        <strong
          key={match.index}
          className="font-bold uppercase tracking-wide text-[#1e1b4b]"
        >
          {token.toUpperCase()}
        </strong>,
      )
    } else if (/^(Answer:|Example)$/i.test(token)) {
      parts.push(
        <em key={match.index} className="font-semibold not-italic text-slate-700">
          {token}
        </em>,
      )
    } else {
      parts.push(
        <strong key={match.index} className="font-semibold text-[#1e1b4b]">
          {token}
        </strong>,
      )
    }
    last = match.index + token.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <span className={className}>{parts}</span>
}

function looksLikePassageDump(line: string) {
  if (line.length > 180) return true
  if (/^READING PASSAGE/i.test(line)) return true
  if (/^INSOMNIA|^THE BIG CATS|^ALTERNATIVE FARMING/i.test(line)) return true
  if (/^Source:/i.test(line)) return true
  if (/^You should spend about/i.test(line)) return true
  return false
}

/** Group fill-blank prompts that repeat the same instruction block. */
export function groupReadingQuestions(
  questions: Array<{ id?: string; prompt: string }>,
): ReadingQuestionGroup[] {
  const groups: ReadingQuestionGroup[] = []

  questions.forEach((q, index) => {
    if (!q.id) return
    const lines = q.prompt
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    let statementLine = lines[lines.length - 1] ?? ""
    const statementIdx = [...lines]
      .map((line, i) => ({ line, i }))
      .reverse()
      .find(({ line }) => /^\d+\.\s+/.test(line))
    if (statementIdx) statementLine = statementIdx.line

    const headerLines = lines.slice(0, statementIdx ? statementIdx.i : Math.max(0, lines.length - 1))
    const title = headerLines[0] ?? `Questions`
    const key = headerLines.join("\n") || title

    const instructions: string[] = []
    const listItems: string[] = []
    const wordBank: string[] = []
    let example: ReadingQuestionGroup["example"] = null

    for (const line of headerLines.slice(1)) {
      if (looksLikePassageDump(line)) continue
      if (/^word bank:/i.test(line)) {
        wordBank.push(
          ...line
            .replace(/^word bank:\s*/i, "")
            .split(/[·•|,]/)
            .map((w) => w.trim())
            .filter(Boolean),
        )
        continue
      }
      if (/^list of headings:/i.test(line) || /^people:/i.test(line)) {
        continue
      }
      if (/^(example)\b/i.test(line) && /answer/i.test(line)) {
        const bits = line.split(/answer[:\s]+/i)
        example = {
          prompt: bits[0]?.replace(/^example[:\s]*/i, "").trim() || "Example",
          answer: bits[1]?.trim() || "",
        }
        continue
      }
      if (
        /^([A-D]|[ivxlcdm]+)\.\s+/i.test(line) ||
        /^([A-D])\s*=\s*/i.test(line) ||
        /^([A-Z]{1,3})\s*[—–-]\s+\S/.test(line) ||
        /^([ivxlcdm]+)\.\s+/i.test(line)
      ) {
        listItems.push(line.replace(/\s*=\s*/g, ". ").replace(/\s*[—–-]\s*/g, "  "))
        continue
      }
      // Compact "A = x · B = y" option rows
      if (/^[A-D]\s*=/.test(line) && /·/.test(line)) {
        listItems.push(
          ...line.split("·").map((chunk) => chunk.trim().replace(/\s*=\s*/, ". ")),
        )
        continue
      }
      if (/^[ivxlcdm]+\.\s+/i.test(line)) {
        listItems.push(line)
        continue
      }
      // Skip accidental numbered stems that aren't real instructions
      if (/^\d+\.\s+Paragraph\s+[A-G]/i.test(line)) continue
      instructions.push(line)
    }

    // Also expand "A = cheetahs · B = leopards" from instructions if still empty
    if (listItems.length === 0) {
      for (const line of instructions) {
        if (/[A-D]\s*=/.test(line) && /·/.test(line)) {
          listItems.push(
            ...line.split("·").map((chunk) => {
              const cleaned = chunk.trim()
              return cleaned.replace(/^([A-D])\s*=\s*/i, "$1. ")
            }),
          )
        }
      }
    }

    const existing = groups.find((g) => g.key === key)
    const item: ReadingQuestionItem = {
      index,
      id: q.id,
      number: extractQuestionNumber(statementLine, index + 1),
      statement: stripQuestionNumber(statementLine),
    }
    if (existing) {
      existing.questions.push(item)
    } else {
      groups.push({
        key,
        title,
        instructions: instructions.filter(
          (line) => !(/[A-D]\s*=/.test(line) && /·/.test(line)),
        ),
        listItems,
        wordBank,
        example,
        questions: [item],
      })
    }
  })

  return groups
}

/** Map a question group to passage 1/2/3 from its first question number. */
export function passageRangeForGroup(
  title: string,
  firstQuestionNumber?: number,
): 1 | 2 | 3 | null {
  const n =
    firstQuestionNumber ??
    (() => {
      const m = title.match(/questions?\s+(\d+)/i)
      return m ? Number(m[1]) : NaN
    })()
  if (!Number.isFinite(n) || n < 1) return null
  // Academic mocks: Passage 1 ends ~13–14, Passage 2 ends at 27, Passage 3 is 28–40.
  if (n <= 14) return 1
  if (n <= 27) return 2
  return 3
}

export function ReadingExamTitle({ title }: { title: string }) {
  return (
    <h1 className="text-center text-2xl font-bold uppercase tracking-tight text-[#1e1b4b] sm:text-3xl">
      {title}
    </h1>
  )
}

export function ReadingPassageView({ block }: { block: ReadingPassageBlock }) {
  if (!block.paragraphs.length && !block.title) return null
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold uppercase tracking-tight text-[#1e1b4b] sm:text-2xl">
          {block.heading}
        </h2>
        {block.instruction ? (
          <p className="mt-2 text-sm italic leading-6 text-slate-500">{block.instruction}</p>
        ) : null}
      </div>
      {block.title ? (
        <h3 className="text-center text-lg font-bold uppercase tracking-wide text-[#1e1b4b] sm:text-xl">
          {block.title}
        </h3>
      ) : null}
      <div className="space-y-5 text-justify text-[15px] leading-7 text-slate-600 sm:text-base sm:leading-8">
        {block.paragraphs.map((p, i) => {
          const labeled = p.match(/^([A-Z])\s+([\s\S]+)$/)
          if (labeled) {
            return (
              <p key={i}>
                <span className="mr-2 font-bold text-[#1e1b4b]">{labeled[1]}</span>
                {labeled[2]}
              </p>
            )
          }
          return <p key={i}>{p}</p>
        })}
      </div>
      {block.source ? (
        <p className="text-sm text-slate-400">{block.source}</p>
      ) : null}
    </section>
  )
}

export function ReadingQuestionGroupView({
  group,
  answers,
  flagged,
  activeIndex,
  onAnswer,
  onFocus,
  onToggleReview,
  inputRef,
}: {
  group: ReadingQuestionGroup
  answers: Record<string, string>
  flagged: Record<string, boolean>
  activeIndex: number
  onAnswer: (id: string, value: string) => void
  onFocus: (index: number) => void
  onToggleReview: (id: string) => void
  inputRef?: (index: number, el: HTMLDivElement | null) => void
}) {
  const titleMatch = group.title.match(/questions?\s*[\d\s–-]+/i)
  const displayTitle = titleMatch ? titleMatch[0].replace(/\s*[—–-]\s*/g, " – ") : group.title

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1e1b4b] sm:text-2xl">{displayTitle}</h2>
        <div className="mt-3 space-y-2.5 text-[15px] leading-7 text-slate-600">
          {group.instructions.map((line, i) => {
            const isKeyRule = /^(YES|NO|NOT GIVEN|TRUE|FALSE)\b/i.test(line.trim())
            if (isKeyRule) {
              const [label, ...rest] = line.trim().split(/\s+if\s+/i)
              return (
                <p key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="inline-flex min-w-[6.5rem] items-center justify-center rounded-md bg-[#1e1b4b]/8 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#1e1b4b]">
                    {label}
                  </span>
                  <span className="text-slate-600">
                    {rest.length ? (
                      <>
                        if <ReadingRichText text={rest.join(" if ")} />
                      </>
                    ) : null}
                  </span>
                </p>
              )
            }
            return (
              <p key={i}>
                <ReadingRichText text={line} />
              </p>
            )
          })}
        </div>
      </div>

      {group.listItems.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Options
          </div>
          <div className="divide-y divide-slate-100 px-1 py-1">
            {group.listItems.map((item, i) => {
              const m = item.match(/^([A-D]|[ivxlcdm]+|[A-Z]{1,3})[.\s]+(.+)$/i)
              return (
                <div
                  key={i}
                  className="grid grid-cols-[3rem_1fr] items-start gap-3 px-3 py-2.5 text-sm leading-6 text-slate-700"
                >
                  <span className="font-bold text-[#1e1b4b]">{m?.[1] ?? ""}</span>
                  <span className="italic text-slate-600">{m?.[2] ?? item}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {group.wordBank.length > 0 ? (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-slate-300 bg-slate-300 sm:grid-cols-4">
          {group.wordBank.map((word) => (
            <div
              key={word}
              className="bg-white px-3 py-2 text-center text-sm font-medium text-slate-700"
            >
              {word}
            </div>
          ))}
        </div>
      ) : null}

      {group.example ? (
        <div className="grid grid-cols-[1fr_auto] gap-x-6 border border-slate-300 px-4 py-3 text-sm">
          <p className="italic font-semibold text-slate-700">Example</p>
          <p className="italic font-semibold text-slate-700">Answer</p>
          <p className="text-slate-600">{group.example.prompt}</p>
          <p className="font-semibold text-slate-800">{group.example.answer}</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {group.questions.map((q) => {
          const answered = Boolean(answers[q.id]?.trim())
          const isFlagged = Boolean(flagged[q.id])
          return (
            <div
              key={q.id}
              ref={(el) => inputRef?.(q.index, el)}
              className="scroll-mt-40 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] leading-7 text-slate-700">
                  <span className="font-semibold text-slate-800">{q.number}. </span>
                  {q.statement}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onToggleReview(q.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        isFlagged
                          ? "border-amber-500 bg-amber-50 text-amber-800"
                          : "border-transparent text-slate-400 hover:border-amber-300 hover:text-amber-700",
                      )}
                      aria-label={
                        isFlagged
                          ? "Remove review flag"
                          : "Mark this question to review later"
                      }
                    >
                      {isFlagged ? "Review" : "Mark"}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[14rem] text-xs">
                    {isFlagged
                      ? "Flagged for review — click to clear"
                      : "Mark for review so you can come back to this question later"}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className={cn(
                  "rounded-xl border bg-white px-4 py-3",
                  isFlagged
                    ? "border-amber-400"
                    : answered
                      ? "border-sky-400"
                      : activeIndex === q.index
                        ? "border-slate-400"
                        : "border-slate-200",
                )}
              >
                <label className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium">Answer:</span>
                  <input
                    value={answers[q.id] ?? ""}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    onFocus={() => onFocus(q.index)}
                    className="h-8 w-28 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-[#1e1b4b] focus:ring-1 focus:ring-[#1e1b4b]/30 sm:w-36"
                    aria-label={`Answer ${q.number}`}
                  />
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ReadingProgressFab({
  progress,
  onClick,
}: {
  progress: number
  onClick: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const radius = 22
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference

  if (!mounted) return null

  // Portal out of animated/transformed ancestors so `fixed` sticks to the viewport.
  return createPortal(
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[60] flex h-16 w-16 flex-col items-center justify-center rounded-full bg-[#1e1b4b] text-white shadow-xl"
      aria-label={`${progress}% complete — back to top`}
    >
      <svg className="absolute inset-0 h-16 w-16 -rotate-90" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#f5c518"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="relative text-[10px] leading-none text-[#f5c518]">▲</span>
      <span className="relative mt-0.5 text-xs font-bold tabular-nums">{progress}%</span>
    </button>,
    document.body,
  )
}
