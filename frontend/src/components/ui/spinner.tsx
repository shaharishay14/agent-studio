import { cn } from "@/lib/utils"

// Ring spinner (21st.dev theshanelevine/loading-state, ring only, no text).
export interface SpinnerProps {
  size?: number
  /** light = white ring for dark surfaces; dark = ink ring for white buttons */
  tone?: "light" | "dark"
  label?: string
  className?: string
}

export function Spinner({ size = 28, tone = "light", label, className }: SpinnerProps) {
  const border = Math.max(1.5, Math.round(size / 14))
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-block shrink-0 animate-sky-spin rounded-full",
        tone === "light" ? "border-white/22 border-t-white" : "border-on-white/20 border-t-on-white",
        className
      )}
      style={{ width: size, height: size, borderWidth: border, borderStyle: "solid" }}
    />
  )
}
