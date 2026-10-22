import * as React from "react"

import { cn } from "@/lib/utils"

// Small uppercase eyebrow over a 60px Inter Tight headline. Put the accent phrase in `accent`;
// it renders in Instrument Serif italic.
export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("m-0 text-[13px] leading-[18px] tracking-[0.08em] text-white/80 uppercase", className)}>{children}</p>
}

export interface SectionHeadingProps {
  eyebrow?: string
  title: React.ReactNode
  accent?: React.ReactNode
  className?: string
  as?: "h1" | "h2"
}

export function SectionHeading({ eyebrow, title, accent, className, as: As = "h2" }: SectionHeadingProps) {
  return (
    <div className={cn("mb-14 flex flex-col items-center gap-4 text-center", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <As className="m-0 max-w-[16ch] font-display text-[38px] leading-[42px] font-medium tracking-[-0.04em] lg:text-[60px] lg:leading-[62px]">
        {title}
        {accent && (
          <>
            {" "}
            <em className="sky-serif">{accent}</em>
          </>
        )}
      </As>
    </div>
  )
}
