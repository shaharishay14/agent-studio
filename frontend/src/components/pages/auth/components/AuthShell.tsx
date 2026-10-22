import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { BlurFade } from '@/components/ui/blur-fade'
import { Logo } from '@/components/ui/logo'

interface AuthShellProps {
  /** Headline; put the accent word in `accent` */
  title?: string
  accent?: string
  subtitle?: ReactNode
  children: ReactNode
}

// Split screen: sky-clouds photo in a rounded frame with the logo and a glass quote card on the
// left, the form on the right. On narrow screens the photo becomes a band above the form
// (bottom padding keeps the last link clear of the floating support button).
export const AuthShell = ({ title, accent, subtitle, children }: AuthShellProps) => {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-night text-white lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-1">
      <div className="relative m-3 flex min-h-[220px] flex-col justify-between gap-8 overflow-hidden rounded-[32px] bg-sky-clouds p-6 sm:m-4 sm:min-h-[280px] sm:p-10">
        <Link
          to="/"
          aria-label="Agent Studio home"
          className="self-start rounded-pill no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
        >
          <Logo className="text-xl" />
        </Link>
        <figure className="sky-glass m-0 max-w-[460px] rounded-[26px] p-5 sm:p-[26px] max-lg:hidden">
          <p className="m-0 font-display text-[30px] leading-9 font-medium tracking-[-0.03em]">
            Describe an agent. <em className="sky-serif">Watch it work.</em>
          </p>
          <p className="mt-3 mb-0 text-white/72">Your agents ask before they send, post or delete anything.</p>
        </figure>
      </div>

      <main className="mx-auto flex w-full max-w-[400px] flex-col justify-center gap-[22px] px-6 pt-10 pb-24 lg:py-12">
        {title && (
          <BlurFade className="flex flex-col gap-2.5">
            <h1 className="m-0 font-display text-[36px] leading-10 font-medium tracking-[-0.035em] sm:text-[40px] sm:leading-11">
              {title}
              {accent && (
                <>
                  {' '}
                  <em className="sky-serif">{accent}</em>
                </>
              )}
            </h1>
            {subtitle && <p className="m-0 text-white/72">{subtitle}</p>}
          </BlurFade>
        )}
        <BlurFade delay={0.12} className="flex flex-col gap-[22px]">
          {children}
        </BlurFade>
      </main>
    </div>
  )
}
