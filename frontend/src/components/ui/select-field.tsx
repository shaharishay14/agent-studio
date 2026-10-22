import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// Native select in the PillInput style (keeps the platform picker on phones).
export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  helper?: string
  containerClassName?: string
}

export function SelectField({ label, helper, id, className, containerClassName, children, ...props }: SelectFieldProps) {
  const autoId = React.useId()
  const selectId = id ?? autoId
  const hintId = helper ? `${selectId}-hint` : undefined

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      <label htmlFor={selectId} className="text-[13px] font-medium text-white/85">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-describedby={hintId}
          className={cn(
            "h-[50px] w-full cursor-pointer appearance-none rounded-pill border border-white/25 bg-white/6 pr-11 pl-[18px] text-[15px] text-white outline-none",
            "transition-[border-color,box-shadow] duration-200 focus:border-white/70 focus:shadow-[0_0_0_4px_rgba(255,255,255,0.08)]",
            "[&>option]:bg-night-2 [&>option]:text-white",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-white/60"
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </div>
      {helper && (
        <p id={hintId} className="m-0 px-[18px] text-[13px] text-white/60">
          {helper}
        </p>
      )}
    </div>
  )
}
