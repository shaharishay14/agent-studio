import * as React from "react"

import { cn } from "@/lib/utils"

// FAQ scroller (21st.dev dhileepkumargm/habit-faq-scroller, Sky version): on the dusk photo.
// Big questions left (inactive at 45% white), answer in a glass panel right with a progress bar.
// Auto-advances every 6s; clicking a question jumps to it and restarts the timer.
// Pauses while keyboard focus is inside, and when reduced motion is on.
export interface FaqItem {
  question: string
  answer: string
}

const ADVANCE_MS = 6000

export function FaqScroller({ items, className }: { items: FaqItem[]; className?: string }) {
  const [active, setActive] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  // bump to restart the interval after a manual pick
  const [cycle, setCycle] = React.useState(0)
  const baseId = React.useId()
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  React.useEffect(() => {
    if (paused || items.length < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = window.setInterval(() => setActive((i) => (i + 1) % items.length), ADVANCE_MS)
    return () => window.clearInterval(t)
  }, [paused, items.length, cycle])

  const pick = (i: number) => {
    setActive(i)
    setCycle((c) => c + 1)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (active + delta + items.length) % items.length
    pick(next)
    tabRefs.current[next]?.focus()
  }

  const item = items[active]

  return (
    <div
      className={cn(
        "grid items-center gap-10 rounded-card p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:p-12",
        "bg-[linear-gradient(rgba(10,14,20,0.6),rgba(10,14,20,0.6)),url(/assets/sky/sky-dusk.webp)] bg-[#1a2a48] bg-cover bg-center",
        className
      )}
      onFocusCapture={(e) => {
        // keyboard focus only; a click restarts the timer instead
        if ((e.target as HTMLElement).matches(":focus-visible")) setPaused(true)
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false)
      }}
    >
      <div className="flex flex-col gap-1" role="tablist" aria-label="Questions" aria-orientation="vertical" onKeyDown={onKeyDown}>
        {items.map((q, i) => (
          <button
            key={q.question}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => pick(i)}
            className={cn(
              "origin-left border-0 bg-transparent px-1 py-3.5 text-left font-display text-[22px] leading-7 font-medium tracking-[-0.025em] lg:text-[26px] lg:leading-8",
              "transition-[color,transform] duration-350 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              i === active ? "scale-[1.04] text-white" : "text-white/45 hover:text-white/80"
            )}
          >
            {q.question}
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="sky-glass flex min-h-[260px] flex-col gap-4 rounded-card p-8"
      >
        <h3 key={`q-${active}`} className="m-0 animate-sky-in font-display text-[28px] leading-[34px] font-medium tracking-[-0.035em]">
          {item.question}
        </h3>
        <p key={`a-${active}`} className="m-0 animate-sky-in text-[17px] leading-[27px] text-white/72">
          {item.answer}
        </p>
        <div className="mt-auto h-[3px] overflow-hidden rounded-xs bg-white/20" aria-hidden="true">
          <i className="block h-full bg-white transition-[width] duration-400" style={{ width: `${((active + 1) / items.length) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
