import * as React from "react"

import { cn } from "@/lib/utils"
import { StatusDot, type Status } from "./status-dot"

// Glass badge pill. Pass `status` to lead with a status dot.
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: Status
  dim?: boolean
}

export function Badge({ status, dim = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-[7px] rounded-pill border border-white/40 bg-white/14 px-3",
        "text-xs leading-none font-medium whitespace-nowrap backdrop-blur-[12px]",
        "[&_svg]:size-3 [&_svg]:stroke-[1.7]",
        dim ? "text-white/85" : "text-white",
        className
      )}
      {...props}
    >
      {status && <StatusDot status={status} />}
      {children}
    </span>
  )
}
