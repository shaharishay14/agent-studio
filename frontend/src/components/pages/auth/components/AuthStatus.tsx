import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

type Tone = 'loading' | 'success' | 'error' | 'info'

interface AuthStatusProps {
  tone: Tone
  icon?: ReactNode
  title: string
  children?: ReactNode
  action?: { label: string; to: string }
}

const ring: Record<Exclude<Tone, 'loading'>, string> = {
  success: 'text-live shadow-[0_0_40px_rgba(126,226,168,0.18)]',
  error: 'text-off shadow-[0_0_40px_rgba(255,138,122,0.18)]',
  info: 'text-white',
}

// Result card for the non-form auth states: loading, success, error, invalid link.
export const AuthStatus = ({ tone, icon, title, children, action }: AuthStatusProps) => {
  return (
    <section
      className="flex flex-col items-start gap-4 rounded-card border border-white/12 bg-night-2 p-7"
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {tone === 'loading' ? (
        <Spinner size={32} />
      ) : (
        <span
          className={cn(
            'grid size-[52px] place-items-center rounded-pill border border-white/35 bg-white/8 [&_svg]:size-6 [&_svg]:stroke-[1.7]',
            ring[tone]
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1.5">
        <h2 className="m-0 font-display text-2xl leading-7 font-medium tracking-[-0.02em]">{title}</h2>
        {children && <div className="text-[15px] leading-6 text-white/72">{children}</div>}
      </div>
      {action && (
        <Link to={action.to} className={cn(buttonVariants({ variant: 'white', size: 'sm' }), 'mt-1')}>
          {action.label}
        </Link>
      )}
    </section>
  )
}
