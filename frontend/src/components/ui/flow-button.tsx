import * as React from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

// Flow button (21st.dev xubohuah/flow-button, Sky version): a pill whose arrow circle
// grows to fill the button on hover. Glass by default; "white" is a white pill with dark text.
type FlowVariant = "glass" | "white"

const base = [
  "sky-flow relative inline-flex h-[50px] items-center gap-3 overflow-hidden rounded-pill border pr-1.5 pl-[22px]",
  "text-[15px] font-semibold whitespace-nowrap no-underline",
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white",
  "aria-disabled:pointer-events-none aria-disabled:opacity-50",
]

const styles: Record<FlowVariant, { root: string; fill: string; text: string; arrow: string }> = {
  glass: {
    root: "border-white/60 bg-white/8 text-white backdrop-blur-[16px]",
    fill: "bg-white",
    text: "group-hover/flow:text-on-white group-focus-visible/flow:text-on-white",
    arrow: "text-on-white",
  },
  white: {
    root: "border-white bg-white text-on-white",
    fill: "bg-on-white",
    text: "group-hover/flow:text-white group-focus-visible/flow:text-white",
    arrow: "text-white",
  },
}

function FlowInner({ variant, children }: { variant: FlowVariant; children: React.ReactNode }) {
  const s = styles[variant]
  return (
    <>
      <span className={cn("sky-flow-fill", s.fill)} aria-hidden="true" />
      <span className={cn("sky-flow-text", s.text)}>{children}</span>
      <span className={cn("sky-flow-arrow inline-grid size-[38px] place-items-center rounded-pill", s.arrow)} aria-hidden="true">
        <ArrowRight className="size-4" strokeWidth={1.7} />
      </span>
    </>
  )
}

export interface FlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: FlowVariant
}

export function FlowButton({ variant = "glass", className, children, type = "button", ...props }: FlowButtonProps) {
  return (
    <button type={type} className={cn("group/flow", base, styles[variant].root, className)} {...props}>
      <FlowInner variant={variant}>{children}</FlowInner>
    </button>
  )
}

export interface FlowLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: FlowVariant
  /** Render with a router Link or another anchor-like component. */
  as?: React.ElementType
  to?: string
}

export function FlowLink({ variant = "glass", className, children, as: As = "a", ...props }: FlowLinkProps) {
  return (
    <As className={cn("group/flow", base, styles[variant].root, className)} {...props}>
      <FlowInner variant={variant}>{children}</FlowInner>
    </As>
  )
}
