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

function ensureImport(text) {
  if (text.includes("@/components/ui/spinner")) {
    if (text.includes("PageLoader")) return text
    return text.replace(
      /import \{([^}]+)\} from "@\/components\/ui\/spinner"/,
      (m, inner) => {
        const names = new Set(
          inner
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        )
        names.add("PageLoader")
        return `import { ${[...names].join(", ")} } from "@/components/ui/spinner"`
      },
    )
  }
  const line = 'import { PageLoader } from "@/components/ui/spinner"\n'
  const match = text.match(/^("use client"\r?\n\r?\n)/)
  if (match) return text.replace(match[0], `${match[0]}${line}`)
  return text.replace(/(import .+?\n)/, `$1${line}`)
}

const re =
  /<p className="text-sm text-(?:muted-foreground|\[#6b5c4f\] dark:text-muted-foreground)">Loading[^<]*<\/p>/g

let changed = 0
for (const file of walk(root)) {
  let text = fs.readFileSync(file, "utf8")
  if (!re.test(text)) continue
  re.lastIndex = 0
  const next = text.replace(re, (m) => {
    const label = m.replace(/<[^>]+>/g, "").trim()
    return `<PageLoader label="${label}" className="min-h-[20vh] py-6" />`
  })
  if (next === text) continue
  text = ensureImport(next)
  fs.writeFileSync(file, text)
  changed++
  console.log("updated", path.relative(root, file))
}
console.log("changed", changed)
