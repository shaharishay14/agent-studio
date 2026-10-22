import { cn } from "@/lib/utils"

// Status dot (21st.dev edwinvakayil/status-dot, Sky version).
// live = green pulsing, busy = needs approval (amber pulsing), off = disconnected (coral), idle = grey.
export type Status = "live" | "busy" | "off" | "idle"

export function StatusDot({ status = "idle", className }: { status?: Status; className?: string }) {
  return <span className={cn("sky-dot", className)} data-status={status} aria-hidden="true" />
}
