import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

// Progress for multi-step modals: a segmented bar with step names (no numbers).
// On phones only the current step's name shows.
export function WizardSteps({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <ol className="m-0 flex list-none gap-1.5 p-0" aria-label="Progress">
        {steps.map((title, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo"
          return (
            <li key={title} className="flex min-w-0 flex-1 flex-col gap-2" aria-current={state === "current" ? "step" : undefined}>
              <span
                className={cn(
                  "h-1 rounded-pill transition-colors duration-300 ease-sky",
                  state === "todo" ? "bg-white/15" : state === "current" ? "bg-white" : "bg-white/60"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "hidden items-center gap-1.5 truncate text-xs sm:flex",
                  state === "current" ? "font-semibold text-white" : state === "done" ? "text-white/72" : "text-white/50"
                )}
              >
                {state === "done" && <Check className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />}
                {title}
                <span className="sr-only">{state === "done" ? " (done)" : state === "todo" ? " (not started)" : ""}</span>
              </span>
            </li>
          )
        })}
      </ol>
      <p className="m-0 text-xs font-semibold text-white sm:hidden" aria-hidden="true">
        {steps[current]}
      </p>
    </div>
  )
}
