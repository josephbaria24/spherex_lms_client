import { cn } from "@/lib/utils"

type IconProps = {
  className?: string
}

/** Hugeicons via Iconify — https://icon-sets.iconify.design/hugeicons/ */

export function HiHeadphones({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M20.085 17c.5-1.5.915-3.563.915-5a9 9 0 1 0-18 0c0 1.437.415 3.5.915 5" />
      <path d="m8.977 19.604l-1.738-4.991c-.186-.466-.777-.7-1.264-.583a2.9 2.9 0 0 0-1.828 3.66l.438 1.326a2.88 2.88 0 0 0 3.643 1.836c.461-.196.876-.762.749-1.248m6.047 0l1.737-4.991c.186-.466.777-.7 1.264-.583a2.9 2.9 0 0 1 1.828 3.66l-.438 1.326a2.88 2.88 0 0 1-3.643 1.836c-.461-.196-.876-.762-.748-1.248" />
    </svg>
  )
}

export function HiBookOpen({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M5.333 3c2.46-.003 4.836.887 6.667 2.5V21a10.07 10.07 0 0 0-6.667-2.5c-1.562 0-2.343 0-2.688-.22a1.16 1.16 0 0 1-.424-.425C2 17.51 2 16.895 2 15.663v-9.26c0-1.428 0-2.141.549-2.72c.548-.579 1.11-.609 2.234-.668Q5.056 3 5.333 3m13.334 0A10.07 10.07 0 0 0 12 5.5V21a10.07 10.07 0 0 1 6.667-2.5c1.562 0 2.343 0 2.688-.22c.207-.133.291-.218.424-.425c.221-.345.221-.96.221-2.192v-9.26c0-1.428 0-2.141-.549-2.72s-1.11-.609-2.234-.668Q18.944 3 18.667 3" />
    </svg>
  )
}

export function HiPen({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M3.5 18.985V20.5h1.514c1.227 0 1.84 0 2.391-.228c.551-.229.985-.662 1.852-1.53l9.864-9.863c.883-.883 1.324-1.324 1.373-1.866q.012-.135 0-.269c-.05-.541-.49-.983-1.373-1.865c-.883-.883-1.324-1.324-1.865-1.373a1.5 1.5 0 0 0-.27 0c-.541.049-.982.49-1.865 1.373l-9.864 9.864c-.867.867-1.3 1.3-1.529 1.852c-.228.55-.228 1.164-.228 2.39M13.5 6.5l4 4" />
    </svg>
  )
}

export function HiMic({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M17 7v4a5 5 0 0 1-10 0V7a5 5 0 0 1 10 0Z" />
      <path
        strokeLinecap="round"
        d="M17 7h-3m3 4h-3m6 0a8 8 0 0 1-8 8m0 0a8 8 0 0 1-8-8m8 8v3m0 0h3m-3 0H9"
      />
    </svg>
  )
}

export function HiLanguageSkill({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12c0 1.052.18 2.062.512 3m10.502-6h8.488M11 15H2.512m18.99-6a9 9 0 0 0-8.488-6c1.6 0 2.909 3.762 2.995 8.5M21.502 9c.278.789.45 1.628.498 2.5M2.512 15A9 9 0 0 0 11 21c-1.544 0-2.816-3.5-2.982-8"
      />
      <path d="M2 5.297C2 4.2 2 3.65 2.187 3.224c.2-.452.542-.815.968-1.025C3.557 2 4.075 2 5.11 2H6c1.886 0 2.828 0 3.414.62C10 3.243 10 4.24 10 6.24v2.259c0 .871 0 1.307-.264 1.457s-.606-.092-1.29-.576l-.105-.073c-.5-.354-.75-.53-1.034-.621c-.283-.091-.584-.091-1.185-.091h-1.01c-1.037 0-1.555 0-1.957-.199a2.06 2.06 0 0 1-.968-1.025C2 6.945 2 6.396 2 5.297Zm20 12c0-1.098 0-1.647-.187-2.073a2.06 2.06 0 0 0-.968-1.025C20.443 14 19.925 14 18.89 14H18c-1.886 0-2.828 0-3.414.62C14 15.243 14 16.24 14 18.24v2.259c0 .871 0 1.307.264 1.457s.606-.092 1.29-.576l.105-.073c.5-.354.75-.53 1.034-.621c.283-.091.584-.091 1.185-.091h1.01c1.037 0 1.555 0 1.957-.199c.426-.21.769-.573.968-1.025c.187-.426.187-.975.187-2.074Z" />
    </svg>
  )
}

export function HiArrowRight({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M9 6s6 4.419 6 6s-6 6-6 6" />
    </svg>
  )
}

export function HiArrowLeft({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M15 6s-6 4.419-6 6s6 6 6 6" />
    </svg>
  )
}

export function HiPlayCircle({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path
        strokeLinejoin="round"
        d="M15.945 12.395c-.176.627-1.012 1.07-2.682 1.955c-1.615.856-2.422 1.285-3.073 1.113a1.66 1.66 0 0 1-.712-.393C9 14.62 9 13.746 9 12s0-2.62.478-3.07c.198-.186.443-.321.712-.392c.65-.173 1.458.256 3.073 1.112c1.67.886 2.506 1.329 2.682 1.955c.073.259.073.531 0 .79Z"
      />
    </svg>
  )
}

export function HiClock({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2" />
    </svg>
  )
}

export function HiTarget({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M15.131 2.5A10 10 0 0 0 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10a10 10 0 0 0-.458-3" />
      <path strokeLinejoin="round" d="M17 12a5 5 0 1 1-5-5" />
      <path d="M19.5 4.5L12 12m7.5-7.5V2m0 2.5H22" />
    </svg>
  )
}

export function HiVolumeHigh({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M14 14.814V9.186c0-3.145 0-4.717-.925-5.109c-.926-.391-2.015.72-4.193 2.945c-1.128 1.152-1.771 1.407-3.376 1.407c-1.403 0-2.105 0-2.61.344C1.85 9.487 2.01 10.882 2.01 12s-.159 2.513.888 3.227c.504.344 1.206.344 2.609.344c1.605 0 2.248.255 3.376 1.407c2.178 2.224 3.267 3.336 4.193 2.945c.925-.392.925-1.964.925-5.11M17 9c.625.82 1 1.863 1 3s-.375 2.18-1 3m3-8c1.25 1.366 2 3.106 2 5s-.75 3.634-2 5" />
    </svg>
  )
}

export function HiTick({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M5 14.5s1.5 0 3.5 3.5c0 0 5.559-9.167 10.5-11" />
    </svg>
  )
}

export function HiCancel({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M18 6L6 18m12 0L6 6" />
    </svg>
  )
}

export function HiRotateClockwise({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M4 2v3.132c0 .294.367.427.555.201A9.97 9.97 0 0 1 12.005 2C17.525 2 22 6.477 22 12c0 3.958-2.299 7.38-5.633 9m-4.632 1q.7 0 1.376-.092M2.265 8.667Q2.097 9.263 2 9.869m.035 3.67q.105.6.274 1.186m1.524 3.271q.358.531.774 1.019M7.43 21.36q.53.303 1.103.547" />
    </svg>
  )
}

export function HiNote({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M16.5 2v3m-9-3v3M12 2v3m1-1.5h-2c-3.3 0-4.95 0-5.975 1.025S4 7.2 4 10.5V15c0 3.3 0 4.95 1.025 5.975S7.7 22 11 22h2c3.3 0 4.95 0 5.975-1.025S20 18.3 20 15v-4.5c0-3.3 0-4.95-1.025-5.975S16.3 3.5 13 3.5M8 15h4m-4-4h8" />
    </svg>
  )
}
