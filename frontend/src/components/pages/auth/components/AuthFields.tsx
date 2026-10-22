import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'

import { PillInput } from '@/components/ui/pill-input'
import { authLinkClass } from './authLinkClass'

interface AuthInputProps {
  id: string
  label: string
  type?: string
  placeholder: string
  icon: ReactNode
  register: UseFormRegisterReturn
  error?: string
  helperText?: string
  autoComplete?: string
}

export const AuthInput = ({ id, label, type = 'text', placeholder, icon, register, error, helperText, autoComplete }: AuthInputProps) => (
  <PillInput
    id={id}
    label={label}
    type={type}
    placeholder={placeholder}
    icon={icon}
    error={error}
    helper={helperText}
    autoComplete={autoComplete}
    {...register}
  />
)

interface PasswordInputProps {
  id: string
  label: string
  placeholder: string
  register: UseFormRegisterReturn
  error?: string
  helperText?: string
  showForgotPassword?: boolean
  autoComplete?: string
}

// Pill password field with show/hide, and an optional "Forgot password?" link in the label row
export const PasswordInput = ({
  id,
  label,
  placeholder,
  register,
  error,
  helperText,
  showForgotPassword = false,
  autoComplete = 'current-password',
}: PasswordInputProps) => {
  const [show, setShow] = useState(false)

  return (
    <PillInput
      id={id}
      label={label}
      labelAction={
        showForgotPassword ? (
          <Link to="/auth/forgot-password" className={`${authLinkClass} text-[13px]`}>
            Forgot password?
          </Link>
        ) : undefined
      }
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      icon={<Lock />}
      error={error}
      helper={helperText}
      autoComplete={autoComplete}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="inline-grid size-[38px] shrink-0 place-items-center rounded-pill text-white/80 hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          {show ? <EyeOff className="size-4" strokeWidth={1.7} /> : <Eye className="size-4" strokeWidth={1.7} />}
        </button>
      }
      {...register}
    />
  )
}

export const AuthDivider = () => (
  <div className="flex items-center gap-3.5 text-xs tracking-[0.08em] text-white/60 uppercase before:h-px before:flex-1 before:bg-white/16 after:h-px after:flex-1 after:bg-white/16">
    Or continue with
  </div>
)
