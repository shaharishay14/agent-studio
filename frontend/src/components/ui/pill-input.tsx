import * as React from "react"

import { cn } from "@/lib/utils"

// Pill text field: label above, glass pill input, optional leading icon and trailing action.
export interface PillInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  trailing?: React.ReactNode
  helper?: string
  error?: string
  containerClassName?: string
}

export const PillInput = React.forwardRef<HTMLInputElement, PillInputProps>(function PillInput(
  { label, icon, trailing, helper, error, id, className, containerClassName, disabled, ...props },
  ref
) {
  const autoId = React.useId()
  const inputId = id ?? autoId
  const hintId = error || helper ? `${inputId}-hint` : undefined

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-white/85">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex h-[50px] items-center gap-2 rounded-pill border bg-white/6 pr-1.5 pl-[18px]",
          "transition-[border-color,box-shadow] duration-200",
          "focus-within:border-white/70 focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.08)]",
          "[&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:stroke-[1.7] [&>svg]:text-white/60",
          error ? "border-off/80" : "border-white/25",
          disabled && "opacity-50"
        )}
      >
        {icon}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={hintId}
          className={cn(
            "h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-white outline-none placeholder:text-white/55 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {trailing}
      </div>
      {(error || helper) && (
        <p id={hintId} className={cn("px-[18px] text-[13px]", error ? "text-off" : "text-white/60")}>
          {error || helper}
        </p>
      )}
    </div>
  )
})
