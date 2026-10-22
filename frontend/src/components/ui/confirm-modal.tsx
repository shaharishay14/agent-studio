import * as React from "react"

import { Button } from "./button"
import { IconCircle } from "./icon-circle"
import { Modal } from "./modal"

// Confirm dialog on the shared Modal shell: Cancel (glass) + a confirm button.
// While `pending`, it can't be dismissed and the confirm button shows a spinner.
export interface ConfirmModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  children: React.ReactNode
  icon?: React.ReactNode
  confirmLabel: string
  pendingLabel?: string
  pending?: boolean
  tone?: "danger" | "default"
}

export function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title,
  children,
  icon,
  confirmLabel,
  pendingLabel,
  pending = false,
  tone = "danger",
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && onCancel()}
      title={title}
      size="sm"
      dismissible={!pending}
      icon={
        icon && (
          <IconCircle className={tone === "danger" ? "border-off/45 bg-off/12 text-off" : undefined}>{icon}</IconCircle>
        )
      }
      footer={
        <>
          <Button variant="glass" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "white"} size="sm" onClick={onConfirm} loading={pending}>
            {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[15px] leading-6 text-white/80">{children}</div>
    </Modal>
  )
}
