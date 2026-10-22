import * as React from "react"

import { cn } from "@/lib/utils"

// Round glass icon holder (menus, approval tool row).
export function IconCircle({
  size = "md",
  className,
  children,
}: {
  size?: "md" | "lg"
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-pill border border-white/35 bg-white/12 text-white",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] [&_svg]:stroke-[1.7]",
        size === "md" ? "size-[38px] [&_svg]:size-4" : "size-[52px] [&_svg]:size-5",
        className
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}

// Social icon (21st.dev shadcnspace/social-icon, Sky version):
// round glass link; hover fills white with a dark icon and lifts 3px.
export interface SocialIconProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  "aria-label": string
  size?: "md" | "lg"
}

export function SocialIcon({ size = "md", className, ...props }: SocialIconProps) {
  return (
    <a
      className={cn(
        "inline-grid place-items-center rounded-pill border border-white/35 bg-white/8 text-white no-underline",
        "transition-[background-color,color,transform] duration-200 hover:-translate-y-[3px] hover:bg-white hover:text-on-white",
        "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white",
        "[&_svg]:size-4 [&_svg]:stroke-[1.7]",
        size === "md" ? "size-[42px]" : "size-[58px]",
        className
      )}
      {...props}
    />
  )
}
