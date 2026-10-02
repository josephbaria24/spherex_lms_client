"use client"

import { useMemo, type ReactNode } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

/**
 * Convert plain CSE math shorthand to LaTeX.
 * Examples:
 *   8 / (6^2)(8^2)  →  \dfrac{8}{(6^{2})(8^{2})}
 *   6^2             →  6^{2}
 */
export function plainMathToLatex(expr: string): string {
  let s = expr.trim()
  s = s.replace(/\^(\d+)/g, "^{$1}")
  s = s.replace(/×/g, "\\times ")
  s = s.replace(/÷/g, "\\div ")
  s = s.replace(/±/g, "\\pm ")
  s = s.replace(/–/g, "-")

  const frac = s.match(/^(.+?)\s*\/\s*(.+)$/)
  if (frac && !s.includes("\\dfrac")) {
    return `\\dfrac{${frac[1].trim()}}{${frac[2].trim()}}`
  }
  return s
}

function renderKatex(latex: string, display = false): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: display,
      strict: "ignore",
    })
  } catch {
    return latex
  }
}

function isLikelyMath(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (t.includes("[[MATH]]")) return true
  if (/\\dfrac|\\frac|\\left|\\right/.test(t)) return true
  // Fraction shorthand from extractor
  if (/^\s*.+\s*\/\s*.+\s*$/.test(t) && /[\d()]/.test(t) && !/[a-zA-Z]{3,}/.test(t)) {
    return true
  }
  // Pure math-ish tokens
  if (/^[\d\s()^{}+\-×÷./=±]+$/.test(t) && /\d/.test(t)) return true
  return false
}

/**
 * Renders quiz text with:
 * - [[EMPH]]word[[/EMPH]] → bold italic underline
 * - [[MATH]]latex[[/MATH]] → KaTeX
 * - auto math like `8 / (6^2)(8^2)` → stacked fraction
 */
export function MathText({
  text,
  className,
  asMathBlock = false,
}: {
  text: string
  className?: string
  /** Prefer display-style math when the whole string is a formula */
  asMathBlock?: boolean
}) {
  const nodes = useMemo(() => {
    const result: ReactNode[] = []
    // Split EMPH and MATH markers
    const parts = text.split(/(\[\[EMPH\]\][\s\S]*?\[\[\/EMPH\]\]|\[\[MATH\]\][\s\S]*?\[\[\/MATH\]\])/g)

    parts.forEach((part, partIndex) => {
      if (!part) return

      const emph = part.match(/^\[\[EMPH\]\]([\s\S]*?)\[\[\/EMPH\]\]$/)
      if (emph) {
        result.push(
          <strong
            key={`e-${partIndex}`}
            className="mx-0.5 inline font-bold italic text-slate-900 underline decoration-slate-900 decoration-2 underline-offset-2 dark:text-white dark:decoration-white"
            style={{ fontStyle: "italic", fontWeight: 700 }}
          >
            {emph[1]}
          </strong>,
        )
        return
      }

      const math = part.match(/^\[\[MATH\]\]([\s\S]*?)\[\[\/MATH\]\]$/)
      if (math) {
        const html = renderKatex(math[1].trim(), asMathBlock)
        result.push(
          <span
            key={`m-${partIndex}`}
            className="mx-0.5 inline-block align-middle [&_.katex]:text-[1.05em]"
            dangerouslySetInnerHTML={{ __html: html }}
          />,
        )
        return
      }

      // Auto-detect whole-part math (typical for options)
      if (isLikelyMath(part) && !/[[]EMPH]/.test(part)) {
        const latex = plainMathToLatex(part)
        const html = renderKatex(latex, asMathBlock)
        result.push(
          <span
            key={`a-${partIndex}`}
            className="inline-block align-middle [&_.katex]:text-[1.05em]"
            dangerouslySetInnerHTML={{ __html: html }}
          />,
        )
        return
      }

      // Mixed prose: lift inline fraction-like tokens `8 / (6^2)(8^2)` or `6^2`
      const mixed = part.split(/(\b\d+(?:\^\d+)?(?:\s*\/\s*\([^)]+\)(?:\([^)]+\))*)|\b\d+\^\d+)/g)
      mixed.forEach((chunk, i) => {
        if (!chunk) return
        if (/^\d+(?:\^\d+)?(?:\s*\/\s*\([^)]+\)(?:\([^)]+\))*)?$/.test(chunk.trim()) || /^\d+\^\d+$/.test(chunk)) {
          const latex = plainMathToLatex(chunk.trim())
          const html = renderKatex(latex, false)
          result.push(
            <span
              key={`i-${partIndex}-${i}`}
              className="mx-0.5 inline-block align-middle"
              dangerouslySetInnerHTML={{ __html: html }}
            />,
          )
        } else {
          result.push(
            <span key={`t-${partIndex}-${i}`} className="whitespace-pre-wrap">
              {chunk}
            </span>,
          )
        }
      })
    })

    return result
  }, [text, asMathBlock])

  return <span className={className}>{nodes}</span>
}
