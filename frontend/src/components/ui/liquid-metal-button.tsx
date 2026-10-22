import * as React from "react"

import { cn } from "@/lib/utils"

// Liquid metal button (21st.dev johuniq/liquid-metal-button, Sky version).
// The metal is a frame, not a fill: animated metallic border, dark glass inside, white text.
// Use at most once per page.
const classes = [
  "sky-metal inline-flex h-[52px] items-center justify-center gap-2 rounded-pill px-[30px]",
  "text-[15px] font-semibold whitespace-nowrap text-white no-underline",
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white",
  "disabled:pointer-events-none disabled:opacity-50",
  "[&_svg]:size-4 [&_svg]:stroke-[1.7]",
]

export function LiquidMetalButton({
  className,
  children,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(classes, className)} {...props}>
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  )
}
