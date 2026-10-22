import * as React from "react"

import { cn } from "@/lib/utils"

// Suggestion / filter chip: rounded pill, white outline at 70%, liquid glass fill.
// `active` = white chip with dark text (filters).
export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({ active = false, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active || undefined}
      className={cn(
        "inline-flex h-[38px] items-center gap-2 rounded-pill border px-[18px] text-sm font-medium whitespace-nowrap",
        "transition-[background-color,transform,color] duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:size-4 [&_svg]:stroke-[1.7]",
        active
          ? "border-white bg-white text-on-white"
          : [
              "border-white/70 bg-linear-to-b from-white/20 to-white/6 text-white",
              "backdrop-blur-[14px] backdrop-saturate-[1.7]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_24px_-12px_rgba(0,0,0,0.5)]",
              "hover:-translate-y-px hover:bg-white/24",
            ],
        className
      )}
      {...props}
    />
  )
}
