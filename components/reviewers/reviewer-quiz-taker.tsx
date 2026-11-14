"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { apiPost, ApiError } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import type { PublicReviewerQuizDetail } from "@/lib/public-reviewers"
import { MathText } from "@/components/reviewers/math-text"
import { toast } from "sonner"
import {
  HiCancel,
  HiClock,
  HiHeadphones,
  HiRotateClockwise,
  HiTick,
  HiVolumeHigh,
} from "@/components/icons/hugeicons"
import { cn } from "@/lib/utils"

type Accent = "sky" | "indigo" | "amber" | "rose" | "teal"

type ReviewerQuizTakerProps = {
  quiz: PublicReviewerQuizDetail
  accent?: Accent
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function WrittenResponse({
  value,
  minimum,
  onChange,
}: {
  value: string
  minimum: number
  onChange: (value: string) => void
}) {
  const count = wordCount(value)
  const goal = Number.isFinite(minimum) && minimum > 0 ? minimum : 1
  return (
    <div className="mt-4 space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your response"
        className="min-h-40 bg-slate-50/80 dark:bg-muted/40"
      />
      <p className={cn("text-xs", count >= goal ? "text-teal-700 dark:text-teal-300" : "text-slate-500")}>
        {count} / {goal} words. This checks length only. It is not an examiner score.
      </p>
    </div>
  )
}

function parseAudioAnswer(value: string | undefined): { url: string; seconds: number } | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as { url?: unknown; seconds?: unknown }
    if (typeof parsed.url !== "string" || !parsed.url) return null
    const seconds = Number(parsed.seconds)
    if (!Number.isFinite(seconds)) return null
    return { url: parsed.url, seconds }
  } catch {
    return null
  }
}

function isIosDevice() {
  const ua = navigator.userAgent
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  return /iPad|iPhone|iPod/.test(ua) || iPadOs
}

function recordingMimeType() {
  if (typeof MediaRecorder === "undefined") return ""
  const preferred = isIosDevice()
    ? ["audio/mp4", "audio/aac", "audio/webm"]
    : ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"]
  return preferred.find((type) => MediaRecorder.isTypeSupported(type)) ?? ""
}

function audioExtension(type: string) {
  if (type.includes("mp4") || type.includes("m4a") || type.includes("aac")) return "m4a"
  if (type.includes("ogg")) return "ogg"
  if (type.includes("wav")) return "wav"
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3"
  return "webm"
}

function AudioResponse({
  minimum,
  value,
  onChange,
}: {
  minimum: number
  value: string
  onChange: (value: string) => void
}) {
  const goal = Number.isFinite(minimum) && minimum > 0 ? minimum : 1
  const saved = parseAudioAnswer(value)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastVoiceRef = useRef(0)
  const monitorStreamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: 24 }, () => 0))
  const [hearingVoice, setHearingVoice] = useState(false)
  const [recorderReady, setRecorderReady] = useState(false)

  useEffect(() => {
    setRecorderReady(typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia))
  }, [])

  useEffect(() => {
    return () => {
      stopMonitor()
      const recorder = recorderRef.current
      if (recorder && recorder.state !== "inactive") recorder.stop()
      recorder?.stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function stopTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  function stopMonitor() {
    stopTimer()
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null
    setLevels(Array.from({ length: 24 }, () => 0))
    setHearingVoice(false)
  }

  async function watchVoice(stream: MediaStream) {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const context = new AudioCtx()
    audioContextRef.current = context
    await context.resume().catch(() => undefined)
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.75
    source.connect(analyser)
    const bins = new Uint8Array(analyser.frequencyBinCount)
    let frame = 0
    const draw = () => {
      analyser.getByteFrequencyData(bins)
      const bars = 24
      const step = Math.max(1, Math.floor(bins.length / bars))
      const next: number[] = []
      let total = 0
      for (let i = 0; i < bars; i++) {
        let sum = 0
        for (let j = 0; j < step; j++) sum += bins[i * step + j] ?? 0
        const level = sum / step / 255
        next.push(level)
        total += level
      }
      if (total / bars > 0.08) lastVoiceRef.current = Date.now()
      frame += 1
      if (frame % 2 === 0) {
        setLevels(next)
        setHearingVoice(Date.now() - lastVoiceRef.current < 1200)
      }
      frameRef.current = requestAnimationFrame(draw)
    }
    draw()
  }

  function releaseStreams(stream?: MediaStream) {
    stream?.getTracks().forEach((track) => track.stop())
    monitorStreamRef.current?.getTracks().forEach((track) => track.stop())
    monitorStreamRef.current = null
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      fileRef.current?.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      })
      const mimeType = recordingMimeType()
      let recorder: MediaRecorder
      try {
        recorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType, audioBitsPerSecond: 128000 } : undefined,
        )
      } catch {
        recorder = new MediaRecorder(stream)
      }
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const seconds = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000))
        const type = recorder.mimeType || mimeType || (isIosDevice() ? "audio/mp4" : "audio/webm")
        const blob = new Blob(chunksRef.current, { type })
        releaseStreams(stream)
        if (blob.size < 1000) {
          toast.error("Nothing was captured. Speak closer to the microphone and record again.")
          return
        }
        setPreviewUrl((current) => {
          if (current?.startsWith("blob:")) URL.revokeObjectURL(current)
          return URL.createObjectURL(blob)
        })
        void upload(blob, seconds)
      }
      recorderRef.current = recorder
      startedRef.current = Date.now()
      lastVoiceRef.current = 0
      setElapsed(0)
      setHearingVoice(false)
      const monitorStream = stream.clone()
      monitorStreamRef.current = monitorStream
      void watchVoice(monitorStream)
      recorder.start(250)
      setRecording(true)
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.round((Date.now() - startedRef.current) / 1000))
      }, 250)
    } catch {
      toast.error("Allow microphone access, or upload a voice memo instead.")
      fileRef.current?.click()
    }
  }

  function stop() {
    setRecording(false)
    stopMonitor()
    const recorder = recorderRef.current
    if (recorder && recorder.state === "recording") {
      try {
        recorder.requestData()
      } catch {
        /* Safari may already flush on stop. */
      }
      recorder.stop()
    }
  }

  function onPickedFile(file: File | undefined) {
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    const probe = document.createElement("audio")
    probe.preload = "metadata"
    probe.src = localUrl
    const beginUpload = (seconds: number) => {
      setPreviewUrl((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current)
        return localUrl
      })
      void upload(file, Math.max(1, seconds))
    }
    probe.onloadedmetadata = () => {
      const duration = Number.isFinite(probe.duration) ? Math.round(probe.duration) : 1
      beginUpload(duration)
    }
    probe.onerror = () => beginUpload(1)
  }

  async function upload(blob: Blob, seconds: number) {
    setUploading(true)
    onChange("")
    try {
      const form = new FormData()
      const extension = audioExtension(blob.type || (isIosDevice() ? "audio/mp4" : "audio/webm"))
      form.append("audio", blob, `speaking.${extension}`)
      form.append("seconds", String(seconds))
      const res = await fetch("/api/lms/reviewers/speaking-recordings", {
        method: "POST",
        credentials: "include",
        body: form,
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; seconds?: number; error?: string }
      if (!res.ok || !data.url) {
        throw new ApiError(data.error ?? "Could not save the recording", res.status)
      }
      onChange(JSON.stringify({ url: data.url, seconds: data.seconds ?? seconds }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the recording")
    } finally {
      setUploading(false)
    }
  }

  const seconds = saved?.seconds ?? (recording ? elapsed : 0)
  const playback = previewUrl || (saved ? assetUrl(saved.url) : "")

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {recording ? (
          <Button type="button" variant="outline" onClick={stop}>
            Stop
          </Button>
        ) : (
          <>
            {recorderReady ? (
              <Button type="button" className="bg-[#FF4B1A] text-white hover:bg-[#e84314]" onClick={() => void start()} disabled={uploading}>
                {saved ? "Record again" : "Record"}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              Upload voice memo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg,.aac"
              capture="user"
              className="hidden"
              onChange={(event) => {
                onPickedFile(event.target.files?.[0])
                event.target.value = ""
              }}
            />
          </>
        )}
        <span className="text-sm tabular-nums text-slate-500">
          {formatTime(seconds)}
          <span className="text-slate-400"> · aim for {formatTime(goal)}</span>
        </span>
        {uploading ? <span className="text-xs text-slate-500">Saving recording…</span> : null}
      </div>
      {recording ? (
        <div className="flex h-16 items-end gap-1 rounded-xl bg-slate-950 px-3 py-2" aria-hidden>
          {levels.map((level, index) => (
            <span
              key={index}
              className="flex-1 rounded-full bg-[#FF4B1A] transition-[height] duration-75"
              style={{ height: `${Math.max(8, Math.round(level * 100))}%` }}
            />
          ))}
        </div>
      ) : null}
      {recording && elapsed >= 2 && !hearingVoice ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
          Nothing is being recorded. Are you speaking? Move closer to the microphone, or check that the browser is using the right mic.
        </p>
      ) : null}
      {recording && hearingVoice ? (
        <p className="text-xs font-medium text-teal-700 dark:text-teal-300">Voice detected</p>
      ) : null}
      {playback ? <audio controls playsInline preload="metadata" src={playback} className="w-full" /> : null}
      <p className="text-xs text-slate-500">
        Record with your microphone. A trainer will assess the recording after you submit. There is no automatic score.
      </p>
    </div>
  )
}

function parseMulti(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

const accents: Record<
  Accent,
  {
    progress: string
    ring: string
    number: string
    submit: string
    radio: string
    check: string
    audioIcon: string
    focus: string
  }
> = {
  sky: {
    progress: "from-sky-400 to-teal-500",
    ring: "ring-sky-300/70",
    number: "bg-sky-700 text-sky-50",
    submit: "bg-sky-700 hover:bg-sky-800 shadow-sky-700/25",
    radio: "text-sky-700 border-slate-300",
    check: "data-[state=checked]:border-sky-700 data-[state=checked]:bg-sky-700",
    audioIcon: "bg-sky-700 text-sky-50",
    focus: "focus-visible:ring-sky-500",
  },
  indigo: {
    progress: "from-indigo-400 to-sky-500",
    ring: "ring-indigo-300/70",
    number: "bg-indigo-700 text-indigo-50",
    submit: "bg-indigo-700 hover:bg-indigo-800 shadow-indigo-700/25",
    radio: "text-indigo-700 border-slate-300",
    check: "data-[state=checked]:border-indigo-700 data-[state=checked]:bg-indigo-700",
    audioIcon: "bg-indigo-700 text-indigo-50",
    focus: "focus-visible:ring-indigo-500",
  },
  amber: {
    progress: "from-amber-400 to-orange-400",
    ring: "ring-amber-300/70",
    number: "bg-amber-700 text-amber-50",
    submit: "bg-amber-700 hover:bg-amber-800 shadow-amber-700/25",
    radio: "text-amber-700 border-slate-300",
    check: "data-[state=checked]:border-amber-700 data-[state=checked]:bg-amber-700",
    audioIcon: "bg-amber-700 text-amber-50",
    focus: "focus-visible:ring-amber-500",
  },
  rose: {
    progress: "from-rose-400 to-orange-400",
    ring: "ring-rose-300/70",
    number: "bg-rose-700 text-rose-50",
    submit: "bg-rose-700 hover:bg-rose-800 shadow-rose-700/25",
    radio: "text-rose-700 border-slate-300",
    check: "data-[state=checked]:border-rose-700 data-[state=checked]:bg-rose-700",
    audioIcon: "bg-rose-700 text-rose-50",
    focus: "focus-visible:ring-rose-500",
  },
  teal: {
    progress: "from-teal-400 to-cyan-500",
    ring: "ring-teal-300/70",
    number: "bg-teal-700 text-teal-50",
    submit: "bg-teal-700 hover:bg-teal-800 shadow-teal-700/25",
    radio: "text-teal-700 border-slate-300",
    check: "data-[state=checked]:border-teal-700 data-[state=checked]:bg-teal-700",
    audioIcon: "bg-teal-700 text-teal-50",
    focus: "focus-visible:ring-teal-500",
  },
}

const card =
  "rounded-2xl border border-slate-200/90 bg-white shadow-[0_10px_36px_-18px_rgba(15,55,70,0.28)] dark:border-border dark:bg-card dark:shadow-black/40"
const optionRow =
  "flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 transition-colors hover:border-teal-300 hover:bg-teal-50/50 dark:border-border dark:bg-muted/40 dark:hover:border-teal-800 dark:hover:bg-teal-950/30"

export function ReviewerQuizTaker({ quiz, accent = "teal" }: ReviewerQuizTakerProps) {
  const a = accents[accent]
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    quiz.time_limit_seconds ?? null,
  )
  const [result, setResult] = useState<{
    score: number | null
    passed: boolean
    pending_review?: boolean
    passing_score: number
    correct: number
    total: number
    band_score: number | null
  } | null>(null)

  const answersRef = useRef(answers)
  const submittingRef = useRef(submitting)
  const resultRef = useRef(result)
  answersRef.current = answers
  submittingRef.current = submitting
  resultRef.current = result

  const answeredCount = quiz.questions.filter((q) => {
    const ans = answers[q.id]
    if (!ans?.trim()) return false
    if (q.question_type === "multi_select" && parseMulti(ans).length === 0) return false
    return true
  }).length
  const progress = quiz.questions.length
    ? Math.round((answeredCount / quiz.questions.length) * 100)
    : 0

  async function submitAnswers(force = false) {
    if (submittingRef.current || resultRef.current) return
    const currentAnswers = answersRef.current
    if (!force) {
      const unanswered = quiz.questions.filter((q) => {
        const ans = currentAnswers[q.id]
        if (!ans?.trim()) return true
        if (q.question_type === "multi_select" && parseMulti(ans).length === 0) return true
        return false
      })
      if (unanswered.length > 0) {
        toast.error("Please answer all questions")
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await apiPost<{
        score: number | null
        passed: boolean
        pending_review?: boolean
        passing_score: number
        correct: number
        total: number
        band_score: number | null
      }>(`/reviewers/public/quizzes/${quiz.id}/submit`, { answers: currentAnswers })
      setResult(res)
      if (res.pending_review) toast.success("Recording submitted for review")
      else if (res.passed) toast.success("Quiz passed!")
      else toast.error(`Score ${res.score}% — need ${res.passing_score}% to pass`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit quiz")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (secondsLeft == null || result) return
    if (secondsLeft <= 0) {
      void submitAnswers(true)
      return
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => (s == null ? s : s - 1)), 1000)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timer tick only
  }, [secondsLeft, result])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submitAnswers(false)
  }

  function setMultiAnswer(questionId: string, optionId: string, checked: boolean) {
    setAnswers((prev) => {
      const current = parseMulti(prev[questionId])
      const next = checked
        ? [...new Set([...current, optionId])]
        : current.filter((id) => id !== optionId)
      return { ...prev, [questionId]: next.join(",") }
    })
  }

  if (result) {
    return (
      <div
        className={cn(
          card,
          "relative overflow-hidden px-6 py-12 text-center sm:px-10",
          "animate-in fade-in zoom-in-95 duration-400",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-1.5",
            result.pending_review ? "bg-[#FF4B1A]" : result.passed ? "bg-teal-500" : "bg-rose-500",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full blur-2xl",
            result.pending_review
              ? "bg-orange-100 dark:bg-orange-950/30"
              : result.passed
                ? "bg-teal-100 dark:bg-teal-500/20"
                : "bg-rose-100 dark:bg-rose-500/20",
          )}
          aria-hidden
        />
        {result.pending_review ? (
          <HiHeadphones className="mx-auto h-14 w-14 text-[#FF4B1A]" />
        ) : result.passed ? (
          <HiTick className="mx-auto h-14 w-14 text-teal-600" />
        ) : (
          <HiCancel className="mx-auto h-14 w-14 text-rose-500" />
        )}
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {result.pending_review ? "Submitted for review" : result.passed ? "Session passed" : "Keep practicing"}
        </p>
        {result.pending_review ? (
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-700 dark:text-slate-200">
            Your recording was received. A trainer will assess it. There is no score yet.
          </p>
        ) : (
          <>
            <p className="mt-3 text-5xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {result.score}%
            </p>
            {result.band_score != null ? (
              <p className="mt-2 inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200">
                Practice band {Number(result.band_score).toFixed(1)}
              </p>
            ) : null}
            {quiz.exam_type === "IELTS" && result.passed ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Signed-in passes count toward your{" "}
                <Link href="/ielts#certificate" className="font-semibold text-[#FF4B1A] hover:underline">
                  certificate of completion
                </Link>
                .
              </p>
            ) : null}
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {result.correct} of {result.total} correct · Pass mark {result.passing_score}%
            </p>
          </>
        )}
        <Button
          className="mt-8 h-11 rounded-full bg-slate-900 px-8 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          onClick={() => {
            setResult(null)
            setAnswers({})
            setSecondsLeft(quiz.time_limit_seconds ?? null)
          }}
        >
          <HiRotateClockwise className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    )
  }

  const hasPassage = Boolean(quiz.passage_html?.trim())
  const hasAudio = Boolean(quiz.audio_url?.trim())
  const urgent = secondsLeft != null && secondsLeft <= 60

  return (
    <div className="space-y-5">
      <div className="sticky top-[4.5rem] z-20 space-y-3">
        {secondsLeft != null ? (
          <div
            className={cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3 shadow-sm backdrop-blur-md transition-colors",
              urgent
                ? "border-rose-300 bg-rose-50/95 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200"
                : "border-slate-200/90 bg-white/90 text-slate-700 dark:border-border dark:bg-card/90 dark:text-slate-200",
            )}
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <HiClock className={cn("h-4 w-4", urgent && "animate-pulse")} />
              Time remaining
            </span>
            <span className="font-mono text-lg font-semibold tracking-wider">
              {formatTime(secondsLeft)}
            </span>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md dark:border-border dark:bg-card/90">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Progress · {answeredCount}/{quiz.questions.length}
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all duration-300",
                a.progress,
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {hasAudio ? (
        <div className={cn(card, "overflow-hidden")}>
          <div className="flex items-center gap-3 border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-teal-50 px-5 py-3 dark:border-sky-900/50 dark:from-sky-950/40 dark:via-card dark:to-teal-950/30">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                a.audioIcon,
              )}
            >
              <HiHeadphones className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Listening audio</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Play once if you can — just like the real test
              </p>
            </div>
            <HiVolumeHigh className="ml-auto h-4 w-4 text-slate-400" />
          </div>
          <div className="px-5 py-4">
            <audio controls className="w-full" src={quiz.audio_url!} preload="metadata">
              Your browser does not support audio.
            </audio>
          </div>
        </div>
      ) : null}

      <div className={hasPassage ? "grid gap-5 lg:grid-cols-2 lg:items-start" : undefined}>
        {hasPassage ? (
          <aside
            className={cn(
              card,
              "border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white p-5 lg:sticky lg:top-44 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto dark:border-indigo-900/40 dark:from-indigo-950/30 dark:to-card",
            )}
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">
              Reading passage
            </p>
            <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-slate-200">
              {quiz.passage_html}
            </div>
          </aside>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {quiz.questions.map((q, idx) => {
            const optionLooksMath = q.options.every((o) =>
              /[/\\^()]|^\d|MATH|dfrac|frac/.test(o.text),
            )
            const answered = Boolean(
              answers[q.id]?.trim() &&
                (q.question_type !== "multi_select" ||
                  parseMulti(answers[q.id]).length > 0),
            )
            return (
              <div
                key={q.id ?? idx}
                className={cn(
                  card,
                  "relative p-5 transition-shadow",
                  answered && cn("ring-2", a.ring),
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs font-bold",
                      a.number,
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-muted dark:text-slate-400">
                    {q.question_type.replace("_", " ")}
                  </span>
                </div>

                <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
                  <MathText
                    text={q.prompt}
                    asMathBlock={/\[\[MATH\]\]|\\dfrac|\\left/.test(q.prompt)}
                  />
                </p>

                {q.question_type === "audio_response" ? (
                  <AudioResponse
                    minimum={q.minimum_seconds ?? Number.parseInt(q.correct_option_id ?? "", 10)}
                    value={q.id ? answers[q.id] ?? "" : ""}
                    onChange={(next) => q.id && setAnswers((prev) => ({ ...prev, [q.id!]: next }))}
                  />
                ) : q.question_type === "written_response" ? (
                  <WrittenResponse
                    value={q.id ? answers[q.id] ?? "" : ""}
                    minimum={q.minimum_words ?? Number.parseInt(q.correct_option_id ?? "", 10)}
                    onChange={(value) =>
                      q.id && setAnswers((prev) => ({ ...prev, [q.id!]: value }))
                    }
                  />
                ) : q.question_type === "fill_blank" ? (
                  <div className="mt-4">
                    <Input
                      value={q.id ? answers[q.id] ?? "" : ""}
                      onChange={(e) =>
                        q.id && setAnswers((prev) => ({ ...prev, [q.id!]: e.target.value }))
                      }
                      placeholder="Type your answer"
                      className={cn(
                        "max-w-md border-slate-200 bg-slate-50/80 placeholder:text-slate-400 dark:border-border dark:bg-muted/50",
                        a.focus,
                      )}
                    />
                  </div>
                ) : q.question_type === "multi_select" ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Select all that apply</p>
                    {q.options.map((opt) => {
                      const selected = parseMulti(q.id ? answers[q.id] : undefined)
                      const checked = selected.includes(opt.id)
                      return (
                        <div key={opt.id} className={optionRow}>
                          <Checkbox
                            id={`${q.id}-${opt.id}`}
                            checked={checked}
                            onCheckedChange={(v) =>
                              q.id && setMultiAnswer(q.id, opt.id, v === true)
                            }
                            className={cn("mt-0.5 border-slate-300", a.check)}
                          />
                          <Label
                            htmlFor={`${q.id}-${opt.id}`}
                            className="flex flex-1 cursor-pointer items-center gap-1.5 font-normal leading-relaxed text-slate-700 dark:text-slate-200"
                          >
                            <span className="font-semibold uppercase text-slate-400">
                              {opt.id}.
                            </span>
                            <MathText text={opt.text} asMathBlock={optionLooksMath} />
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <RadioGroup
                    className="mt-4 space-y-2"
                    value={q.id ? answers[q.id] : undefined}
                    onValueChange={(v) =>
                      q.id && setAnswers((prev) => ({ ...prev, [q.id!]: v }))
                    }
                  >
                    {q.options.map((opt) => (
                      <div key={opt.id} className={optionRow}>
                        <RadioGroupItem
                          value={opt.id}
                          id={`${q.id}-${opt.id}`}
                          className={cn("mt-0.5", a.radio)}
                        />
                        <Label
                          htmlFor={`${q.id}-${opt.id}`}
                          className="flex flex-1 cursor-pointer items-center gap-1.5 font-normal leading-relaxed text-slate-700 dark:text-slate-200"
                        >
                          <span className="font-semibold uppercase text-slate-400">
                            {opt.id}.
                          </span>
                          <MathText text={opt.text} asMathBlock={optionLooksMath} />
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            )
          })}

          <Button
            type="submit"
            disabled={submitting}
            className={cn(
              "h-12 w-full rounded-full text-base font-semibold text-white shadow-lg",
              a.submit,
            )}
          >
            {submitting ? "Submitting…" : "Submit answers"}
          </Button>
        </form>
      </div>
    </div>
  )
}
