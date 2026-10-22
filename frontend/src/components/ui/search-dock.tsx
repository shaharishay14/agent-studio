import * as React from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

// Expanding search (21st.dev moumensoliman/expanding-search-dock-shadcnui, Sky version):
// a round glass button that expands to a 420px pill input.
export interface SearchDockProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
}

export function SearchDock({ value, onChange, placeholder = "Search…", label = "Search", className }: SearchDockProps) {
  const [open, setOpen] = React.useState(value.length > 0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const openDock = () => {
    setOpen(true)
    // focus after the width transition has started
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const close = () => {
    onChange("")
    setOpen(false)
  }

  return (
    <div
      className={cn(
        "sky-glass inline-flex h-[52px] items-center overflow-hidden rounded-pill p-1.5",
        "transition-[width] duration-[450ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
        open ? "w-full sm:w-[420px]" : "w-[52px]",
        className
      )}
    >
      <button
        type="button"
        onClick={open ? () => inputRef.current?.focus() : openDock}
        aria-label={label}
        aria-expanded={open}
        className="inline-grid size-10 shrink-0 place-items-center rounded-pill text-white hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-white"
      >
        <Search className="size-4" strokeWidth={1.7} />
      </button>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && close()}
        placeholder={placeholder}
        aria-label={label}
        tabIndex={open ? 0 : -1}
        className={cn(
          "min-w-0 flex-1 border-0 bg-transparent text-[15px] text-white outline-none placeholder:text-white/65",
          "transition-opacity duration-250",
          open ? "opacity-100 delay-200" : "opacity-0"
        )}
      />
      <button
        type="button"
        onClick={close}
        aria-label="Close search"
        tabIndex={open ? 0 : -1}
        className={cn(
          "inline-grid size-10 shrink-0 place-items-center rounded-pill text-white/80 transition-opacity duration-250 hover:bg-white/12 hover:text-white",
          "focus-visible:outline-2 focus-visible:outline-white",
          open ? "opacity-100 delay-200" : "pointer-events-none opacity-0"
        )}
      >
        <X className="size-4" strokeWidth={1.7} />
      </button>
    </div>
  )
}
