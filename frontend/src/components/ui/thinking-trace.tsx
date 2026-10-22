import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { Spinner } from "./spinner"

// Thinking indicator + expandable agent loop trace (21st.dev larsen66/thinking-orbs, Sky version).
// Small orb + shimmering "Working on it" + step count + chevron; expands to the steps,
// each with a check (done), spinner (current) or cross (failed) and the tool it used.
export type TraceStepStatus = "done" | "running" | "error"

export interface TraceStep {
  id: string
  label: string
  /** e.g. "Gmail: search" */
  tool?: string
  status: TraceStepStatus
}

export function ThinkingOrb({ className }: { className?: string }) {
  return (
    <span className={cn("sky-orbs", className)} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}

export interface ThinkingTraceProps {
  steps: TraceStep[]
  /** true while the agent loop is still running */
  working?: boolean
  title?: string
  doneTitle?: string
  defaultOpen?: boolean
  className?: string
}

export function ThinkingTrace({
  steps,
  working = true,
  title = "Working on it",
  doneTitle = "Done",
  defaultOpen = false,
  className,
}: ThinkingTraceProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const listId = React.useId()
  const count = steps.length

  return (
    <div className={cn("sky-glass max-w-[560px] rounded-3xl p-1.5", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={listId}
        disabled={count === 0}
        className={cn(
          "flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left text-[15px] leading-none font-medium text-white",
          "hover:bg-white/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:hover:bg-transparent"
        )}
      >
        <ThinkingOrb />
        <span className={working ? "sky-shimmer" : undefined} aria-live="polite">
          {working ? title : doneTitle}
        </span>
        {count > 0 && (
          <span className="text-[13px] font-normal text-white/72">
            {count} {count === 1 ? "step" : "steps"}
          </span>
        )}
        {count > 0 && (
          <ChevronDown
            className={cn("ml-auto size-4 transition-transform duration-250", open && "rotate-180")}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        )}
      </button>
      {open && count > 0 && (
        <ol id={listId} className="m-0 mt-1 mr-3 mb-3 ml-6 flex animate-sky-in list-none flex-col gap-3 border-l border-white/20 py-0 pl-[18px]">
          {steps.map((step) => (
            <li
              key={step.id}
              className={cn(
                "relative flex flex-wrap items-center gap-2.5 text-sm leading-5",
                step.status === "running" ? "font-medium text-white" : "text-white/85"
              )}
            >
              <span
                className={cn(
                  "absolute -left-[29px] grid size-5 place-items-center rounded-pill border border-white/35 bg-night-3",
                  step.status === "error" ? "text-off" : "text-live"
                )}
              >
                {step.status === "done" && <Check className="size-3" strokeWidth={2} aria-label="Done" />}
                {step.status === "error" && <X className="size-3" strokeWidth={2} aria-label="Failed" />}
                {step.status === "running" && <Spinner size={12} label="In progress" />}
              </span>
              <span>{step.label}</span>
              {step.tool && <Badge>{step.tool}</Badge>}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
