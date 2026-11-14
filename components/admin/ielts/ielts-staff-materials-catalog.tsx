"use client"

import Link from "next/link"
import { FileText, Headphones, Layers3 } from "lucide-react"
import {
  IELTS_ACADEMIC_KEYS,
  IELTS_ACADEMIC_MOCKS,
  type IeltsAcademicMaterial,
} from "@/lib/ielts-academic-materials"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type PracticeQuiz = {
  id: string
  title: string
  category: string | null
  is_published: boolean
  question_count: number
}

type PracticeSkill = {
  id: string
  title: string
  description: string | null
  quiz_count: number
  quizzes: PracticeQuiz[]
}

export function IeltsStaffMaterialsCatalog({
  skills,
  className,
}: {
  skills: PracticeSkill[]
  className?: string
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Mock tests
        </h3>
        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
          {IELTS_ACADEMIC_MOCKS.map((mock) => (
            <div
              key={mock.id}
              className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  <span className="text-muted-foreground">{mock.day}</span>
                  <span className="mx-1.5 text-border">·</span>
                  {mock.title.replace(/^Academic mock test\s*/i, "Mock ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mock.files.map((file) => (
                  <CatalogFileChip key={file.id} file={file} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Answer keys
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {IELTS_ACADEMIC_KEYS.map((file) => (
            <CatalogFileChip key={file.id} file={file} />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Practice sets
        </h3>
        {skills.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No practice skills yet.</p>
        ) : (
          <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
            {skills.map((skill) => (
              <div key={skill.id} className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Layers3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{skill.title}</p>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {skill.quiz_count}
                  </span>
                </div>
                {skill.quizzes.length > 0 ? (
                  <ul className="mt-1.5 space-y-1 pl-5">
                    {skill.quizzes.map((quiz) => (
                      <li key={quiz.id}>
                        <Link
                          href={`/ielts/practice/${quiz.id}`}
                          className="flex items-center justify-between gap-2 rounded-md px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-[#f3ede4] hover:text-foreground dark:hover:bg-muted"
                        >
                          <span className="min-w-0 truncate underline-offset-2 hover:underline">
                            {quiz.title}
                          </span>
                          <Badge
                            variant={quiz.is_published ? "default" : "secondary"}
                            className="h-5 shrink-0 px-1.5 text-[10px]"
                          >
                            {quiz.is_published ? "Live" : "Draft"}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CatalogFileChip({ file }: { file: IeltsAcademicMaterial }) {
  const Icon = file.kind === "audio" ? Headphones : FileText
  return (
    <button
      type="button"
      onClick={() => window.open(file.href, "_blank", "noopener,noreferrer")}
      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#f3ede4] px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-[#ebe4da] dark:bg-muted dark:hover:bg-muted/80"
    >
      <Icon className="h-3 w-3 shrink-0 opacity-70" />
      <span className="truncate">{file.title}</span>
    </button>
  )
}
