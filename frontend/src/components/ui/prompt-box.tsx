import * as React from "react"
import { ArrowUp, Settings2, Zap } from "lucide-react"

import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

// AI prompt box (21st.dev jahed/ai-prompt-box, Sky version): dark glass box, radius 28,
// a soft conic glow (warm, blue, ember, white) blurred 30px behind it, rotating every 9s.
// Toggles are outline pills; on = white outline + faint warm glow. Send = white circle.

export function PromptGlowFrame({
  glowOpacity,
  className,
  children,
}: {
  glowOpacity?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("relative w-full max-w-[700px]", className)}>
      <div className="sky-prompt-glow" style={glowOpacity != null ? { opacity: glowOpacity } : undefined} aria-hidden="true" />
      <div
        className={cn(
          "relative rounded-card border border-edge bg-[rgba(14,18,26,0.72)] px-[18px] pt-[18px] pb-3.5 text-left",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-[24px] backdrop-saturate-[1.4]"
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function PromptToggle({
  on,
  icon,
  label,
  hint,
  onClick,
}: {
  on: boolean
  icon: React.ReactNode
  label: string
  hint?: string
  onClick?: () => void
}) {
  const hintId = React.useId()
  return (
    <span className="group/tog relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        aria-describedby={hint ? hintId : undefined}
        tabIndex={onClick ? undefined : -1}
        className={cn(
          "inline-flex h-[34px] items-center gap-1.5 rounded-pill border px-[13px] text-[13px] leading-none font-medium transition-all duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white [&_svg]:size-3.5 [&_svg]:stroke-[1.7]",
          on
            ? "border-white/70 bg-white/16 text-white shadow-[0_0_18px_rgba(230,176,109,0.35)]"
            : "border-white/22 text-white/75 hover:border-white/45 hover:text-white"
        )}
      >
        {icon}
        {label}
      </button>
      {hint && (
        <span
          id={hintId}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 rounded-pill border border-white/25 bg-night-2/95 px-3 py-1.5",
            "text-xs whitespace-nowrap text-white/85 opacity-0 transition-opacity duration-200",
            "group-focus-within/tog:opacity-100 group-hover/tog:opacity-100"
          )}
        >
          {hint}
        </span>
      )}
    </span>
  )
}

export function PromptSend({
  label,
  disabled,
  loading,
  onClick,
  demo,
}: {
  label: string
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  demo?: boolean
}) {
  return (
    <button
      type={demo ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      tabIndex={demo ? -1 : undefined}
      className={cn(
        "ml-auto inline-grid size-10 shrink-0 place-items-center rounded-pill bg-white text-on-white transition-transform duration-150",
        "hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      )}
    >
      {loading ? <Spinner size={16} tone="dark" /> : <ArrowUp className="size-4" strokeWidth={1.7} />}
    </button>
  )
}

export type PromptMode = "yolo" | "manual"

export const PROMPT_MODES: { value: PromptMode; label: string; hint: string; icon: React.ReactNode }[] = [
  { value: "yolo", label: "YOLO", hint: "Create your agent in one step", icon: <Zap /> },
  { value: "manual", label: "Manual", hint: "Set name, tools and files step by step", icon: <Settings2 /> },
]

export interface PromptBoxProps {
  value: string
  onChange: (value: string) => void
  mode: PromptMode
  onModeChange: (mode: PromptMode) => void
  onSubmit: () => void
  submitting?: boolean
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function PromptBox({
  value,
  onChange,
  mode,
  onModeChange,
  onSubmit,
  submitting = false,
  placeholder = "Describe an agent…",
  autoFocus = false,
  className,
}: PromptBoxProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const id = React.useId()

  React.useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true })
  }, [autoFocus])

  // Grow with the text, up to 200px
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  return (
    <PromptGlowFrame className={className}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim() && !submitting) onSubmit()
        }}
      >
        <label htmlFor={id} className="sr-only">
          Describe your agent
        </label>
        <textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="block max-h-[200px] min-h-14 w-full resize-none overflow-y-auto border-0 bg-transparent px-1.5 py-1 text-lg leading-7 text-white outline-none placeholder:text-white/55"
        />
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <div role="group" aria-label="Creation mode" className="flex gap-1.5">
            {PROMPT_MODES.map((m) => (
              <PromptToggle
                key={m.value}
                on={mode === m.value}
                icon={m.icon}
                label={m.label}
                hint={m.hint}
                onClick={() => onModeChange(m.value)}
              />
            ))}
          </div>
          <PromptSend label={submitting ? "Creating agent" : "Create agent"} disabled={!value.trim()} loading={submitting} />
        </div>
      </form>
    </PromptGlowFrame>
  )
}
