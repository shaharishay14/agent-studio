import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

// Sky buttons are pills: white with dark text, or glass with a thin white outline.
// Never white text on a white button.
export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-pill border border-transparent",
    "font-semibold tracking-[-0.005em] whitespace-nowrap no-underline",
    "transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.7]",
  ],
  {
    variants: {
      variant: {
        white: "bg-white text-on-white hover:bg-[#f1ede8]",
        glass: [
          "border-edge-strong bg-white/10 text-white backdrop-blur-[16px] backdrop-saturate-[1.6]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/18",
        ],
        ghost: "bg-transparent text-white/85 hover:text-white",
        // Destructive confirm: coral fill with dark text
        danger: "bg-off text-on-white hover:bg-[#ff9d8f]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-[46px] px-[22px] text-[15px]",
        lg: "h-14 px-[30px] text-[17px]",
      },
      block: {
        true: "flex w-full",
      },
    },
    defaultVariants: {
      variant: "white",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({
  className,
  variant,
  size,
  block,
  loading = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size={16} tone={variant === "white" || variant === "danger" || variant == null ? "dark" : "light"} />}
      {children}
    </button>
  )
}

// Round icon-only button. Always pass an aria-label.
export const iconButtonVariants = cva(
  [
    "inline-grid shrink-0 place-items-center rounded-pill text-white/80 transition-colors",
    "hover:bg-white/12 hover:text-white",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:stroke-[1.7]",
  ],
  {
    variants: {
      size: {
        sm: "size-8",
        md: "size-[38px]",
        lg: "size-11",
      },
    },
    defaultVariants: { size: "md" },
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  "aria-label": string
}

export function IconButton({ className, size, type = "button", ...props }: IconButtonProps) {
  return <button type={type} className={cn(iconButtonVariants({ size }), className)} {...props} />
}
