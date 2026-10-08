"use client"

import { assetUrl } from "@/lib/asset-url"
import { cn } from "@/lib/utils"

export type PlaqueDetails = {
  learnerName: string
  courseTitle: string
  coverUrl: string | null
  serial: string | null
  issuedLabel: string
}

function PlaqueFace({
  details,
  className,
}: {
  details: PlaqueDetails
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.1rem] bg-[linear-gradient(145deg,#fff6d6_0%,#e7c56a_22%,#8d5e16_48%,#f6e2a8_68%,#6e4712_100%)] p-[7px] shadow-[0_22px_36px_rgba(40,24,8,0.38),inset_0_1px_0_rgba(255,255,255,0.8)]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[0.85rem] bg-[linear-gradient(180deg,#fffdf8_0%,#f3e7d2_100%)] px-4 py-4 text-[#1a1f2e] sm:px-5">
        <div className="flex items-start gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[#c6a15a] bg-[#efe4d2] sm:h-20 sm:w-20">
            {details.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(details.coverUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-[#8a7044]">
                SphereX
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6424]">
              SphereX
            </p>
            <p className="mt-1 font-serif text-sm font-semibold leading-tight sm:text-base">
              Certificate of Completion
            </p>
            <p className="mt-2 truncate text-lg font-semibold leading-none sm:text-xl">
              {details.learnerName}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-[#5c5146]">{details.courseTitle}</p>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3 border-t border-[#e4d3ae] pt-2 text-[10px] text-[#6b5c4f]">
          <span>{details.issuedLabel}</span>
          <span className="font-semibold tracking-wide text-[#1a1f2e]">
            {details.serial ?? "Pending"}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-[70%] plaque-holo-sheen mix-blend-screen" />
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(118deg,transparent_0_14px,rgba(255,255,255,0.16)_14px_15px)] mix-blend-soft-light" />
      </div>
    </div>
  )
}

export function CertificatePlaque({
  details,
  className,
}: {
  details: PlaqueDetails
  className?: string
}) {
  return (
    <div className={cn("mx-auto w-full max-w-xl", className)}>
      <div className="[perspective:1100px]">
        <div className="transition-transform duration-500 [transform:rotateX(8deg)_rotateY(-16deg)] hover:[transform:rotateX(3deg)_rotateY(-6deg)]">
          <PlaqueFace details={details} />
        </div>
      </div>
      <div
        aria-hidden
        className="mx-6 -mt-1 h-12 overflow-hidden opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      >
        <div className="origin-top scale-y-[-1] blur-[0.3px]">
          <PlaqueFace details={details} />
        </div>
      </div>
    </div>
  )
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export async function downloadPlaquePng(details: PlaqueDetails) {
  const width = 3600
  const height = 2100
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not prepare the image")

  ctx.clearRect(0, 0, width, height)

  const frame = ctx.createLinearGradient(0, 0, width, height)
  frame.addColorStop(0, "#fff6d6")
  frame.addColorStop(0.22, "#e7c56a")
  frame.addColorStop(0.48, "#8d5e16")
  frame.addColorStop(0.68, "#f6e2a8")
  frame.addColorStop(1, "#6e4712")
  roundRect(ctx, 40, 40, width - 80, height - 80, 72)
  ctx.fillStyle = frame
  ctx.fill()

  const paper = ctx.createLinearGradient(0, 120, 0, height - 120)
  paper.addColorStop(0, "#fffdf8")
  paper.addColorStop(1, "#f3e7d2")
  roundRect(ctx, 110, 110, width - 220, height - 220, 48)
  ctx.fillStyle = paper
  ctx.fill()

  const cover = details.coverUrl ? await loadImage(assetUrl(details.coverUrl)) : null
  const photoX = 200
  const photoY = 280
  const photoSize = 720
  roundRect(ctx, photoX, photoY, photoSize, photoSize, 28)
  ctx.save()
  ctx.clip()
  if (cover) {
    ctx.drawImage(cover, photoX, photoY, photoSize, photoSize)
  } else {
    ctx.fillStyle = "#efe4d2"
    ctx.fillRect(photoX, photoY, photoSize, photoSize)
  }
  ctx.restore()
  ctx.lineWidth = 10
  ctx.strokeStyle = "#c6a15a"
  roundRect(ctx, photoX, photoY, photoSize, photoSize, 28)
  ctx.stroke()

  ctx.fillStyle = "#8a6424"
  ctx.font = "600 64px Helvetica, Arial, sans-serif"
  ctx.fillText("SPHEREX", 1080, 420)

  ctx.fillStyle = "#1a1f2e"
  ctx.font = "600 92px Georgia, serif"
  ctx.fillText("Certificate of Completion", 1080, 560)

  ctx.font = "700 120px Helvetica, Arial, sans-serif"
  ctx.fillText(details.learnerName, 1080, 780)

  ctx.fillStyle = "#5c5146"
  ctx.font = "48px Helvetica, Arial, sans-serif"
  wrapText(ctx, details.courseTitle, 1080, 900, 2100, 64)

  ctx.strokeStyle = "#e4d3ae"
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(200, 1680)
  ctx.lineTo(width - 200, 1680)
  ctx.stroke()

  ctx.fillStyle = "#6b5c4f"
  ctx.font = "44px Helvetica, Arial, sans-serif"
  ctx.fillText(details.issuedLabel, 200, 1780)
  ctx.fillStyle = "#1a1f2e"
  ctx.font = "700 44px Helvetica, Arial, sans-serif"
  ctx.textAlign = "right"
  ctx.fillText(details.serial ?? "Pending", width - 200, 1780)
  ctx.textAlign = "left"

  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.globalCompositeOperation = "screen"
  const sheen = ctx.createLinearGradient(0, 0, width, height)
  sheen.addColorStop(0.35, "rgba(255,255,255,0)")
  sheen.addColorStop(0.45, "rgba(125,220,255,0.9)")
  sheen.addColorStop(0.52, "rgba(255,170,255,0.85)")
  sheen.addColorStop(0.58, "rgba(255,230,140,0.8)")
  sheen.addColorStop(0.68, "rgba(255,255,255,0)")
  roundRect(ctx, 110, 110, width - 220, height - 220, 48)
  ctx.fillStyle = sheen
  ctx.fill()
  ctx.restore()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
  if (!blob) throw new Error("Could not create the PNG")
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${details.serial ?? "certificate"}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ")
  let line = ""
  let cursor = y
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, cursor)
      line = word
      cursor += lineHeight
    } else {
      line = next
    }
  }
  if (line) ctx.fillText(line, x, cursor)
}
