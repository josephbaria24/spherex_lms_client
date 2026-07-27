import Image from "next/image"
import { cn } from "@/lib/utils"

interface SidebarIconProps {
  src: string
  className?: string
}

export function SidebarIcon({ src, className }: SidebarIconProps) {
  return (
    <Image
      src={src}
      alt=""
      width={20}
      height={20}
      className={cn(
        "shrink-0 transition-colors",
        className
      )}
    />
  )
}
