import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Toggle } from "@base-ui/react/toggle"
import { ToggleGroup } from "@base-ui/react/toggle-group"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

/** Slight overshoot, like the reference's cubic-bezier(.3, 1.3, .5, 1) over 0.45s. */
const haloSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 26,
}

export interface HaloToggleGroupItem {
  value: string
  label: ReactNode
  disabled?: boolean
}

export interface HaloToggleGroupProps {
  items: HaloToggleGroupItem[]
  /** Selected value; omit for uncontrolled usage with `defaultValue`. */
  value?: string
  defaultValue?: string
  onValueChange?: (next: string) => void
  className?: string
  /** Glass track on a photo; false = solid night panel. */
  translucent?: boolean
  disabled?: boolean
  /** Accessible name for the group */
  "aria-label"?: string
}

export function HaloToggleGroup({
  items,
  value: valueProp,
  defaultValue,
  onValueChange,
  className,
  translucent = true,
  disabled = false,
  "aria-label": ariaLabel,
}: HaloToggleGroupProps) {
  const reduceMotion = useReducedMotion() ?? false
  const trackRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [thumb, setThumb] = useState({ x: 0, width: 0 })

  const isControlled = valueProp !== undefined
  const [uncontrolled, setUncontrolled] = useState(
    defaultValue ?? items[0]?.value ?? ""
  )
  const selected = isControlled ? (valueProp ?? "") : uncontrolled

  const setSelected = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolled(next)
      }
      onValueChange?.(next)
    },
    [isControlled, onValueChange]
  )

  const groupValue = useMemo(() => (selected ? [selected] : []), [selected])

  const measureThumb = useCallback(() => {
    const track = trackRef.current
    const active = selected ? itemRefs.current.get(selected) : undefined
    if (!(track && active)) {
      setThumb({ x: 0, width: 0 })
      return
    }
    const tr = track.getBoundingClientRect()
    const br = active.getBoundingClientRect()
    setThumb({
      x: br.left - tr.left,
      width: br.width,
    })
  }, [selected])

  useLayoutEffect(() => {
    measureThumb()
  }, [measureThumb])

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track || typeof ResizeObserver === "undefined") {
      return
    }
    const ro = new ResizeObserver(() => measureThumb())
    ro.observe(track)
    return () => ro.disconnect()
  }, [measureThumb])

  return (
    <div
      className={cn(
        "relative inline-flex max-w-full rounded-full border border-white/25 p-[5px]",
        translucent ? "bg-night/40 backdrop-blur-[16px]" : "bg-night-2",
        className
      )}
      ref={trackRef}
    >
      {/* Sliding indicator: white outline with a white + warm halo */}
      <motion.div
        animate={{
          x: thumb.width > 0 ? thumb.x - 1 : 0, // measured from the border box; positioned inside the 1px border
          width: thumb.width,
          opacity: thumb.width > 0 ? 1 : 0,
        }}
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-[5px] bottom-[5px] left-0 rounded-full",
          "border border-white/80 bg-white/16",
          "shadow-[0_0_22px_rgba(255,255,255,0.35),0_0_50px_rgba(230,176,109,0.35),inset_0_1px_0_rgba(255,255,255,0.6)]"
        )}
        initial={false}
        transition={reduceMotion ? { duration: 0 } : haloSpring}
      />

      <ToggleGroup
        aria-label={ariaLabel}
        className="relative z-1 flex min-w-0 gap-0"
        disabled={disabled}
        multiple={false}
        onValueChange={(next) => {
          const first = next[0]
          if (typeof first === "string") {
            setSelected(first)
          }
        }}
        value={groupValue}
      >
        {items.map((item) => (
          <Toggle
            className={cn(
              "relative flex h-10 min-w-0 flex-1 items-center justify-center rounded-full px-5",
              "text-sm font-medium whitespace-nowrap text-white/70",
              "transition-colors duration-200 ease-sky hover:text-white",
              "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white",
              "disabled:pointer-events-none disabled:opacity-50",
              "aria-pressed:text-white"
            )}
            disabled={item.disabled}
            key={item.value}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(item.value, el)
              } else {
                itemRefs.current.delete(item.value)
              }
            }}
            value={item.value}
          >
            {item.label}
          </Toggle>
        ))}
      </ToggleGroup>
    </div>
  )
}
