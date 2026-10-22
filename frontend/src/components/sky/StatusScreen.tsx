import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

// Centered glass card on the dusk photo, for one-off states: errors, "creating your agent", done.
// `fullscreen` for pages rendered outside the app shell (no top bar).
export function StatusScreen({ children, fullscreen = false, className }: { children: ReactNode; fullscreen?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "grid place-items-center bg-[#1a2a48] bg-[linear-gradient(rgba(10,14,20,0.35),rgba(10,14,20,0.35)),url(/assets/sky/sky-dusk.webp)] bg-cover bg-center px-4 py-12 text-white",
        fullscreen ? "min-h-dvh" : "min-h-[calc(100dvh-61px)]"
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-[480px] animate-sky-in flex-col items-center gap-3 rounded-card border border-white/20 bg-night/55 p-8 text-center",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-[20px]",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
