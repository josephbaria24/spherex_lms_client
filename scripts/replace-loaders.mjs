import fs from "fs"
import path from "path"

const root = process.cwd()

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".next" || ent.name === "scripts") continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else if (/\.(tsx|ts)$/.test(ent.name)) out.push(p)
  }
  return out
}

function ensureSpinnerImport(text, needsSpinner, needsPageLoader) {
  const names = []
  if (needsSpinner) names.push("Spinner")
  if (needsPageLoader) names.push("PageLoader")
  if (names.length === 0) return text
  const spinnerImport = `import { ${names.join(", ")} } from "@/components/ui/spinner"`
  if (text.includes("@/components/ui/spinner")) {
    return text.replace(/import \{[^}]+\} from "@\/components\/ui\/spinner"/, spinnerImport)
  }
  const match = text.match(/^("use client"\r?\n\r?\n)/)
  if (match) return text.replace(match[0], `${match[0]}${spinnerImport}\n`)
  return text.replace(/(import .+?\n)/, `$1${spinnerImport}\n`)
}

function stripLoader2Import(text) {
  if (/\bLoader2\b/.test(text.replace(/import \{[^}]*\} from "lucide-react"/g, ""))) {
    // Loader2 still used in JSX somehow
  }
  return text.replace(/import \{([^}]+)\} from "lucide-react"/g, (m, inner) => {
    const parts = inner
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => s !== "Loader2")
    if (parts.length === 0) return ""
    return `import { ${parts.join(", ")} } from "lucide-react"`
  })
}

const files = walk(root)
let changed = 0

for (const file of files) {
  if (file.endsWith(`${path.sep}components${path.sep}ui${path.sep}spinner.tsx`)) continue
  let text = fs.readFileSync(file, "utf8")
  const orig = text

  text = text.replace(
    /<div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" \/>/g,
    "<Spinner size={40} />",
  )
  text = text.replace(
    /<div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" \/>/g,
    "<Spinner size={36} />",
  )

  text = text.replace(/<Loader2 className="([^"]*animate-spin[^"]*)" \/>/g, (m, cls) => {
    let size = 16
    if (/h-8|size-8/.test(cls)) size = 40
    else if (/h-6|size-6/.test(cls)) size = 32
    else if (/h-5|size-5/.test(cls)) size = 28
    else if (/h-3\.5|size-3\.5/.test(cls)) size = 14
    const extra = []
    if (/\bmr-2\b/.test(cls)) extra.push("mr-2")
    if (/\bshrink-0\b/.test(cls)) extra.push("shrink-0")
    const className = extra.length ? ` className="${extra.join(" ")}"` : ""
    return `<Spinner size={${size}}${className} />`
  })

  text = text.replace(
    /<p className="text-sm text-muted-foreground">Loading dashboard…<\/p>/g,
    '<PageLoader label="Loading dashboard…" className="min-h-[20vh] py-6" />',
  )
  text = text.replace(
    /<p className="text-sm text-muted-foreground">Loading dashboard\.\.\.<\/p>/g,
    '<PageLoader label="Loading dashboard…" className="min-h-[20vh] py-6" />',
  )
  text = text.replace(
    /<p className="text-sm text-muted-foreground">Loading courses…<\/p>/g,
    '<PageLoader label="Loading courses…" className="min-h-[20vh] py-6" />',
  )
  text = text.replace(
    /<p className="text-sm text-muted-foreground">Loading…<\/p>/g,
    '<PageLoader label="Loading…" className="min-h-[20vh] py-6" />',
  )
  text = text.replace(
    /<p className="text-sm text-\[#6b5c7a\] dark:text-violet-300\/80">Loading courses…<\/p>/g,
    '<PageLoader label="Loading courses…" className="min-h-[12vh] py-4" />',
  )
  text = text.replace(
    /<span className="text-sm text-muted-foreground">Loading…<\/span>/g,
    "<Spinner size={20} />",
  )
  text = text.replace(
    /<Suspense fallback=\{<p className="text-sm text-slate-500">Loading…<\/p>\}>/g,
    '<Suspense fallback={<PageLoader label="Loading…" className="min-h-[20vh] py-6" />}>',
  )
  text = text.replace(
    /Loading…\s*\n\s*<\/div>/g,
    (m) => m.replace("Loading…", ""),
  )

  if (text === orig) continue

  const needsSpinner = text.includes("<Spinner")
  const needsPageLoader = text.includes("<PageLoader")
  text = ensureSpinnerImport(text, needsSpinner, needsPageLoader)

  if (!/\bLoader2\b/.test(text.replace(/import \{[^}]*\} from "lucide-react"/g, "IMPORT"))) {
    // still may have Loader2 in remaining import - strip it
  }
  if (!text.includes("<Loader2") && !text.includes("Loader2 className")) {
    text = stripLoader2Import(text)
  } else if (!/\bLoader2\b/.test(text.split("\n").filter((l) => !l.includes("import")).join("\n"))) {
    text = stripLoader2Import(text)
  }

  // if Loader2 no longer referenced outside imports
  const withoutImports = text
    .split("\n")
    .filter((l) => !l.trim().startsWith("import "))
    .join("\n")
  if (!withoutImports.includes("Loader2")) {
    text = stripLoader2Import(text)
  }

  text = text.replace(/\n{3,}/g, "\n\n")
  fs.writeFileSync(file, text)
  changed++
  console.log("updated", path.relative(root, file))
}

console.log("changed", changed)
