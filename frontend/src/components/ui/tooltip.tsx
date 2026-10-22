import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Sky tooltip: small night pill. Built on Radix, so only one tooltip is open at a time,
// Escape closes it, and pressing the trigger closes it until the pointer leaves.
// It opens on hover and on keyboard focus only: focus left behind by a click doesn't open it.
export const TooltipProvider = TooltipPrimitive.Provider

export interface TooltipProps {
  content: React.ReactNode
  /** A single focusable element (button, link) */
  children: React.ReactElement
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

export function Tooltip({ content, children, side = "bottom", className }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger
        asChild
        onFocus={(e) => {
          // Radix skips its own focus handler when this one calls preventDefault
          if (!e.currentTarget.matches(":focus-visible")) e.preventDefault()
        }}
      >
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={8}
          className={cn(
            "z-[70] animate-sky-in rounded-pill border border-white/25 bg-night-2 px-3 py-1.5",
            "text-xs whitespace-nowrap text-white/85 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.7)]",
            className
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
