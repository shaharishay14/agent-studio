import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

// Large selectable card (pick one of a few options). Selected = brighter outline and a check.
export interface ChoiceCardProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  icon: React.ReactNode
  title: string
  description?: string
  selected: boolean
}

export function ChoiceCard({ icon, title, description, selected, className, ...props }: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "relative flex w-full flex-col items-start gap-3 rounded-inner border p-4 text-left transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-white/65 bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
          : "border-white/15 bg-white/[0.03] hover:border-white/35",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-pill border [&_svg]:size-[18px] [&_svg]:stroke-[1.7]",
          selected ? "border-white bg-white text-on-white" : "border-white/30 bg-white/8 text-white"
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-white">{title}</span>
        {description && <span className="text-[13px] leading-[19px] text-white/66">{description}</span>}
      </span>
      {selected && <Check className="absolute top-4 right-4 size-4 text-white" strokeWidth={2} aria-hidden="true" />}
    </button>
  )
}
