import * as React from "react"

import { cn } from "@/lib/utils"

// Multi-line companion to PillInput: label above, rounded glass field, optional helper or error.
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helper?: React.ReactNode
  error?: string
  containerClassName?: string
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, helper, error, id, className, containerClassName, ...props },
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
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hintId}
        className={cn(
          "w-full resize-y rounded-[20px] border bg-white/6 px-4 py-3 text-sm leading-[21px] text-white outline-none placeholder:text-white/55",
          "transition-[border-color,box-shadow] duration-200 focus:border-white/70 focus:shadow-[0_0_0_4px_rgba(255,255,255,0.08)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-off/80" : "border-white/25",
          className
        )}
        {...props}
      />
      {(error || helper) && (
        <p id={hintId} className={cn("m-0 px-1 text-[13px]", error ? "text-off" : "text-white/60")}>
          {error || helper}
        </p>
      )}
    </div>
  )
})
