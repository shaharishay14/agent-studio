import type { ReactNode } from "react"

import { BlurFade } from "@/components/ui/blur-fade"
import { Eyebrow } from "@/components/ui/section-heading"

interface HeaderBandProps {
  eyebrow: string
  title: string
  /** Accent word, in Instrument Serif italic */
  accent?: string
  subtitle?: ReactNode
  /** Right side: toggles, primary action */
  actions?: ReactNode
  /** Full-width row under the title, e.g. filter chips */
  below?: ReactNode
}

// App page header on the dusk photo, fading into night at the bottom
export function HeaderBand({ eyebrow, title, accent, subtitle, actions, below }: HeaderBandProps) {
  return (
    <section className="relative bg-[linear-gradient(180deg,rgba(10,14,20,0.2),#0a0e14),url(/assets/sky/sky-dusk.webp)] bg-[#1a2a48] bg-cover bg-[center_30%] pt-14 pb-10">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <BlurFade className="flex flex-col gap-3">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="m-0 font-display text-[36px] leading-10 font-medium tracking-[-0.035em] sm:text-[44px] sm:leading-12">
            {title}
            {accent && (
              <>
                {" "}
                <em className="sky-serif">{accent}</em>
              </>
            )}
          </h1>
          {subtitle && <div className="m-0 text-white/72">{subtitle}</div>}
        </BlurFade>
        {actions && (
          <BlurFade delay={0.12} className="flex flex-wrap items-center gap-2.5">
            {actions}
          </BlurFade>
        )}
        {below && (
          <BlurFade delay={0.12} className="w-full">
            {below}
          </BlurFade>
        )}
      </div>
    </section>
  )
}
