import * as React from "react"

import { cn } from "@/lib/utils"
import { BrandIcon } from "./brand-icon"
import { LogoMark } from "./logo"

// Integrations honeycomb (21st.dev meschacirung/integrations-3, Sky version): 7 tiles in a 2-3-2
// layout, center tile raised with our logo, outer tiles fading at the edges. Every 2s the six
// outer icons fade out (scale .8, blur) and the next six tools fade in, staggered 60ms.
const CYCLE_MS = 2000
const OUT_MS = 420
const SLOTS = 6

function Tile({ center, children }: { center?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "grid size-24 place-items-center rounded-[22px] border text-white xl:size-[158px] xl:rounded-card",
        center
          ? "border-white/30 bg-linear-to-b from-white/14 to-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_24px_48px_-16px_rgba(0,0,0,0.7),0_0_60px_rgba(255,215,168,0.12)]"
          : "border-white/10 bg-linear-to-b from-white/7 to-white/[0.025]"
      )}
    >
      {children}
    </div>
  )
}

export function IntegrationsCluster({ tools, className }: { tools: string[]; className?: string }) {
  const [tick, setTick] = React.useState(0)
  const [out, setOut] = React.useState(false)

  React.useEffect(() => {
    if (tools.length <= SLOTS) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let swap: number | undefined
    const t = window.setInterval(() => {
      setOut(true)
      swap = window.setTimeout(() => {
        setTick((n) => n + 1)
        setOut(false)
      }, OUT_MS)
    }, CYCLE_MS)
    return () => {
      window.clearInterval(t)
      window.clearTimeout(swap)
    }
  }, [tools.length])

  const slot = (k: number) => {
    const name = tools[(tick * SLOTS + k) % tools.length]
    return (
      <Tile key={k}>
        <span className="sky-i3-icon inline-grid" data-out={out} style={{ transitionDelay: `${k * 60}ms` }}>
          <BrandIcon name={name} className="size-9 xl:size-14" />
        </span>
        <span className="sr-only">{name}</span>
      </Tile>
    )
  }

  return (
    <div className={cn("sky-i3-mask flex flex-col items-center gap-3 xl:gap-[18px]", className)} aria-label="Integrations" role="group">
      <div className="flex justify-center gap-3 xl:gap-[18px]">{[slot(0), slot(1)]}</div>
      <div className="flex justify-center gap-3 xl:gap-[18px]">
        {slot(2)}
        <Tile center>
          <LogoMark size={64} className="max-xl:!size-10" />
        </Tile>
        {slot(3)}
      </div>
      <div className="flex justify-center gap-3 xl:gap-[18px]">{[slot(4), slot(5)]}</div>
    </div>
  )
}
