import * as XLSX from "xlsx"
import type { QuizQuestion } from "@/lib/lesson-types"

const TYPE_HEADERS = new Set(["question type", "question tyle", "type"])
const QUESTION_HEADERS = new Set(["questions", "question", "prompt"])
const CHOICE_HEADERS = new Set(["choices", "choice", "options"])
const ANSWER_HEADERS = new Set(["correct answers", "correct answer", "answer", "correct"])

export type QuizImportResult = {
  questions: QuizQuestion[]
  errors: string[]
  title?: string
  passingScore?: number
}

function headerKey(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ")
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  const src = text.replace(/^\uFEFF/, "")

  for (let i = 0; i < src.length; i++) {
    const char = src[i]
    if (quoted) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
    } else if (char === ",") {
      row.push(cell)
      cell = ""
    } else if (char === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else if (char !== "\r") {
      cell += char
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((cells) => cells.some((value) => value.trim()))
}

function normalizeType(raw: string): QuizQuestion["question_type"] | null {
  const value = headerKey(raw)
  if (["multiple choice", "multiplechoice", "mcq", "mc"].includes(value)) return "multiple_choice"
  if (["true false", "true/false", "tf", "boolean", "true or false"].includes(value)) {
    return "true_false"
  }
  if (value === "multiple_choice" || value === "true_false") {
    return value
  }
  return null
}

function splitChoices(raw: string): string[] {
  const text = raw.trim()
  if (!text) return []
  const parts = text.includes("|")
    ? text.split("|")
    : text.includes("\n")
      ? text.split(/\n+/)
      : text.includes(";")
        ? text.split(";")
        : [text]
  return parts.map((part) => part.trim()).filter(Boolean)
}

function optionId() {
  return `opt-${Math.random().toString(36).slice(2, 10)}`
}

function answerTokens(raw: string): string[] {
  const text = raw.trim()
  if (!text) return []
  if (text.includes("|")) return text.split("|").map((part) => part.trim()).filter(Boolean)
  if (text.includes(";")) return text.split(";").map((part) => part.trim()).filter(Boolean)
  return [text]
}

function matchChoice(choices: string[], answer: string): number {
  const tokens = answerTokens(answer)
  for (const token of tokens) {
    const exact = choices.findIndex((choice) => choice.toLowerCase() === token.toLowerCase())
    if (exact >= 0) return exact

    const letter = token.toUpperCase()
    if (/^[A-D]$/.test(letter)) {
      const index = letter.charCodeAt(0) - 65
      if (index >= 0 && index < choices.length) return index
    }
    if (/^\d+$/.test(token)) {
      const index = Number(token) - 1
      if (index >= 0 && index < choices.length) return index
    }
  }
  return -1
}

function matchTrueFalse(answer: string): "true" | "false" | null {
  for (const token of answerTokens(answer)) {
    const value = token.toLowerCase()
    if (["true", "t", "yes", "y"].includes(value)) return "true"
    if (["false", "f", "no", "n"].includes(value)) return "false"
  }
  return null
}

function questionsFromRows(rows: string[][]): QuizImportResult {
  if (rows.length < 2) {
    return { questions: [], errors: ["The file needs a header row and at least one question."] }
  }

  const headers = rows[0]!.map(headerKey)
  const typeIdx = headers.findIndex((header) => TYPE_HEADERS.has(header))
  const questionIdx = headers.findIndex((header) => QUESTION_HEADERS.has(header))
  const choiceIdx = headers.findIndex((header) => CHOICE_HEADERS.has(header))
  const answerIdx = headers.findIndex((header) => ANSWER_HEADERS.has(header))

  if (typeIdx < 0 || questionIdx < 0 || choiceIdx < 0 || answerIdx < 0) {
    return {
      questions: [],
      errors: [
        "Use these columns: question type, questions, choices, correct answers.",
      ],
    }
  }

  const questions: QuizQuestion[] = []
  const errors: string[] = []

  rows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    const prompt = (cells[questionIdx] ?? "").trim()
    if (!prompt) return

    const type = normalizeType(cells[typeIdx] ?? "")
    if (!type) {
      errors.push(`Row ${rowNumber}: question type must be multiple_choice or true_false.`)
      return
    }

    if (type === "true_false") {
      const correctId = matchTrueFalse(cells[answerIdx] ?? "")
      if (!correctId) {
        errors.push(`Row ${rowNumber}: correct answer must be True or False.`)
        return
      }
      questions.push({
        prompt,
        question_type: "true_false",
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correct_option_id: correctId,
      })
      return
    }

    const choices = splitChoices(cells[choiceIdx] ?? "")
    if (choices.length < 2) {
      errors.push(`Row ${rowNumber}: choices need at least two options separated by |.`)
      return
    }
    const matched = matchChoice(choices, cells[answerIdx] ?? "")
    if (matched < 0) {
      errors.push(`Row ${rowNumber}: correct answer does not match a choice.`)
      return
    }
    const options = choices.map((text) => ({
      id: optionId(),
      text,
    }))
    questions.push({
      prompt,
      question_type: "multiple_choice",
      options,
      correct_option_id: options[matched]!.id,
    })
  })

  if (questions.length === 0 && errors.length === 0) {
    errors.push("No questions found in the file.")
  }

  return { questions, errors }
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim()
}

function childText(parent: Element, tag: string) {
  const child = Array.from(parent.children).find((el) => el.localName === tag)
  return child?.textContent ?? ""
}

function isTrueFalsePair(options: { text: string }[]) {
  if (options.length !== 2) return false
  const labels = options.map((option) => option.text.trim().toLowerCase())
  return labels.includes("true") && labels.includes("false")
}

/** LearnDash / WpProQuiz export (`<wpProQuiz>`). Correctness comes from correct="true". */
export function questionsFromWpProQuizXml(xml: string): QuizImportResult {
  if (typeof DOMParser === "undefined") {
    return { questions: [], errors: ["XML import needs a browser."] }
  }
  const doc = new DOMParser().parseFromString(xml, "text/xml")
  if (doc.querySelector("parsererror")) {
    return { questions: [], errors: ["This file is not valid XML."] }
  }
  const rootName = doc.documentElement?.localName?.toLowerCase()
  const quiz = Array.from(doc.getElementsByTagName("quiz"))[0]
  if (rootName !== "wpproquiz" || !quiz) {
    return { questions: [], errors: ["Upload a LearnDash or WpProQuiz export (.xml)."] }
  }

  const title = stripHtml(childText(quiz, "title"))
  const passingMatch = xml.match(/sfwd-quiz_passingpercentage"\s*:\s*"(\d+)"/)
  const passingScore = passingMatch ? Number(passingMatch[1]) : undefined
  const questionsWrap = Array.from(quiz.children).find((el) => el.localName === "questions")
  const questionNodes = Array.from(questionsWrap?.children ?? []).filter(
    (el) => el.localName === "question",
  )
  const questions: QuizQuestion[] = []
  const errors: string[] = []

  questionNodes.forEach((question, index) => {
    const number = index + 1
    const answerType = (question.getAttribute("answerType") ?? "single").toLowerCase()
    const prompt = stripHtml(childText(question, "questionText"))
    if (!prompt) {
      errors.push(`Question ${number} has no text.`)
      return
    }
    if (answerType !== "single" && answerType !== "multiple") {
      errors.push(`Question ${number} uses “${answerType}”, which this quiz editor cannot import.`)
      return
    }

    const answersWrap = Array.from(question.children).find((el) => el.localName === "answers")
    const answers = Array.from(answersWrap?.children ?? []).filter((el) => el.localName === "answer")
    const options = answers
      .map((answer) => ({
        id: optionId(),
        text: stripHtml(childText(answer, "answerText")),
        correct: answer.getAttribute("correct") === "true",
      }))
      .filter((answer) => answer.text)
    if (options.length < 2) {
      errors.push(`Question ${number} needs at least two answers.`)
      return
    }
    const correct = options.filter((answer) => answer.correct)
    if (correct.length === 0) {
      errors.push(`Question ${number} has no answer marked correct="true".`)
      return
    }
    if (correct.length > 1) {
      errors.push(`Question ${number} has more than one correct answer, so it was skipped.`)
      return
    }

    if (isTrueFalsePair(options)) {
      const correctText = correct[0]!.text.trim().toLowerCase()
      questions.push({
        prompt,
        question_type: "true_false",
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correct_option_id: correctText === "true" ? "true" : "false",
      })
      return
    }

    questions.push({
      prompt,
      question_type: "multiple_choice",
      options: options.map(({ id, text }) => ({ id, text })),
      correct_option_id: correct[0]!.id,
    })
  })

  if (questions.length === 0 && errors.length === 0) {
    errors.push("No questions found in the quiz export.")
  }

  return {
    questions,
    errors,
    title: title || undefined,
    passingScore:
      passingScore != null && passingScore >= 0 && passingScore <= 100 ? passingScore : undefined,
  }
}

export async function importQuizFile(file: File): Promise<QuizImportResult> {
  const name = file.name.toLowerCase()
  if (name.endsWith(".xml") || file.type === "text/xml" || file.type === "application/xml") {
    return questionsFromWpProQuizXml(await file.text())
  }
  if (name.endsWith(".csv") || file.type === "text/csv") {
    return questionsFromRows(parseCsv(await file.text()))
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const book = XLSX.read(await file.arrayBuffer(), { type: "array" })
    const sheet = book.Sheets[book.SheetNames[0] ?? ""]
    if (!sheet) return { questions: [], errors: ["The workbook has no sheets."] }
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
    })
    return questionsFromRows(
      rows.map((row) => row.map((cell) => (cell == null ? "" : String(cell)))),
    )
  }
  return { questions: [], errors: ["Upload a .csv or .xlsx file."] }
}

export function downloadQuizTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["question type", "questions", "choices", "correct answers"],
    ["multiple_choice", "What is 2 + 2?", "3 | 4 | 5", "4"],
    ["true_false", "The sky is blue.", "True | False", "True"],
  ])
  sheet["!cols"] = [{ wch: 20 }, { wch: 40 }, { wch: 36 }, { wch: 20 }]
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, "Quiz")
  XLSX.writeFile(book, "quiz-import-template.xlsx")
}
