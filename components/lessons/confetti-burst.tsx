"use client"

import { useEffect, useRef } from "react"

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  spin: number
  life: number
}

const COLORS = ["#FF4B1A", "#FFD166", "#06D6A0", "#4CC9F0", "#F72585", "#FFFFFF"]

export function ConfettiBurst({ active = true }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let frame = 0
    let raf = 0
    let running = true
    const particles: Particle[] = []

    function resize() {
      const parent = canvas!.parentElement
      const width = parent?.clientWidth || window.innerWidth
      const height = parent?.clientHeight || 420
      canvas!.width = Math.max(320, width)
      canvas!.height = Math.max(240, height)
    }

    function spawn(count: number) {
      const { width, height } = canvas!
      for (let i = 0; i < count; i++) {
        particles.push({
          x: width * (0.1 + Math.random() * 0.8),
          y: height * (0.02 + Math.random() * 0.18),
          vx: (Math.random() - 0.5) * 4.5,
          vy: Math.random() * 1.2 + 0.6,
          size: 4 + Math.random() * 7,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.18,
          life: 1,
        })
      }
    }

    function tick() {
      if (!running || !ctx) return
      frame += 1
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)

      // Keep raining confetti for ~4s, then let pieces drift out.
      if (frame < 240 && frame % 5 === 0) spawn(8)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!
        p.vy += 0.035
        p.vx *= 0.995
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.spin
        p.life -= 0.0028
        if (p.life <= 0 || p.y > canvas!.height + 24) {
          particles.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.15))
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }

      if (frame < 520 || particles.length > 0) {
        raf = window.requestAnimationFrame(tick)
      }
    }

    resize()
    spawn(64)
    raf = window.requestAnimationFrame(tick)
    window.addEventListener("resize", resize)

    return () => {
      running = false
      window.cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  )
}
