import * as React from "react"
import { Dialog } from "radix-ui"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { IconButton } from "./button"

// The one Sky modal shell: night panel with a thin outline over a dimmed, blurred page.
// Radix handles focus trap, Escape, scroll lock and returning focus. On phones it becomes a
// bottom sheet.
const SIZES = {
  sm: "sm:max-w-[440px]",
  md: "sm:max-w-[560px]",
  lg: "sm:max-w-[720px]",
  xl: "sm:max-w-[880px]",
}

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Shown left of the title, e.g. an IconCircle or brand logo */
  icon?: React.ReactNode
  size?: keyof typeof SIZES
  /** Sticky footer, usually the action buttons */
  footer?: React.ReactNode
  /** Prevent closing (e.g. while a delete is running) */
  dismissible?: boolean
  children?: React.ReactNode
  className?: string
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  size = "md",
  footer,
  dismissible = true,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => (dismissible || next) && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] animate-sky-in bg-night/70 backdrop-blur-[6px]" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-[81] flex max-h-[90dvh] w-full animate-sky-in flex-col overflow-hidden text-white outline-none",
            "rounded-t-[28px] border border-b-0 border-white/20 bg-night-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_30px_80px_-20px_rgba(0,0,0,0.8)]",
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[85dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card sm:border-b",
            SIZES[size],
            className
          )}
        >
          <div className="flex items-start gap-3.5 px-6 pt-6 pb-4">
            {icon}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Dialog.Title className="m-0 font-display text-[22px] leading-7 font-medium tracking-[-0.02em]">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="m-0 text-sm text-white/66">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</Dialog.Description>
              )}
            </div>
            {dismissible && (
              <Dialog.Close asChild>
                <IconButton aria-label="Close" className="-mt-1 -mr-2">
                  <X />
                </IconButton>
              </Dialog.Close>
            )}
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>}
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
