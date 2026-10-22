import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"
import { IconCircle } from "./icon-circle"
import { StatusDot, type Status } from "./status-dot"

// Approval card: glass. Status dot + title, expiry badge, tool row, message preview,
// Deny (glass) / Approve (white). Presentational; the chat page wires it to the approval flow.
export interface ApprovalCardProps {
  title?: string
  status?: Status
  badge?: React.ReactNode
  toolIcon: React.ReactNode
  toolName: string
  toolDetail?: React.ReactNode
  preview?: React.ReactNode
  /** Extra content between the preview and the buttons (warnings, argument list) */
  children?: React.ReactNode
  onDeny?: () => void
  onApprove?: () => void
  deciding?: boolean
  /** Landing demo: show the Approve press state */
  pressed?: boolean
  /** Landing demo: buttons are decorative */
  demo?: boolean
  done?: boolean
  className?: string
}

export function ApprovalCard({
  title = "Waiting for your approval",
  status = "busy",
  badge,
  toolIcon,
  toolName,
  toolDetail,
  preview,
  children,
  onDeny,
  onApprove,
  deciding = false,
  pressed = false,
  demo = false,
  done = false,
  className,
}: ApprovalCardProps) {
  return (
    <div
      className={cn(
        "sky-glass flex w-full max-w-[460px] flex-col gap-4 rounded-card p-[18px] transition-[border-color] duration-300 sm:p-[22px]",
        done && "border-live/60",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="flex items-center gap-2 font-semibold whitespace-nowrap" aria-live="polite">
          <StatusDot status={status} />
          {title}
        </span>
        {badge && <Badge className="shrink-0">{badge}</Badge>}
      </div>
      <div className="flex items-center gap-3">
        <IconCircle>{toolIcon}</IconCircle>
        <span className="flex min-w-0 flex-col">
          <b className="font-semibold">{toolName}</b>
          {toolDetail && <span className="truncate text-[13px] text-white/72">{toolDetail}</span>}
        </span>
      </div>
      {preview && <p className="m-0 rounded-2xl bg-night/30 px-3.5 py-3 text-sm leading-[21px] text-white/90">{preview}</p>}
      {children}
      <div className="flex justify-end gap-2">
        <Button variant="glass" size="sm" onClick={onDeny} disabled={deciding} tabIndex={demo ? -1 : undefined}>
          Deny
        </Button>
        <Button
          variant="white"
          size="sm"
          onClick={onApprove}
          disabled={deciding}
          tabIndex={demo ? -1 : undefined}
          className={cn("transition-[transform,box-shadow] duration-200", pressed && "scale-[0.94] shadow-[0_0_0_6px_rgba(255,255,255,0.25)]")}
        >
          <Check />
          Approve
        </Button>
      </div>
    </div>
  )
}
