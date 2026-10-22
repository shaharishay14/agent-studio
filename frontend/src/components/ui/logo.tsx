import { cn } from "@/lib/utils"

// Temporary logo mark (two nodes joined by a bar): white tile, dark glyph. `tone` tints the tile.
export function LogoMark({ size = 30, tone, className }: { size?: number; tone?: string; className?: string }) {
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center bg-white text-on-white", className)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: tone }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-[56%]">
        <circle cx="7.5" cy="7.5" r="5" />
        <rect x="12" y="12" width="10" height="10" rx="2.6" />
        <path d="M9 9l5 5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-display text-[17px] leading-none font-semibold tracking-[-0.02em] text-white", className)}>
      <LogoMark />
      Agent Studio
    </span>
  )
}
