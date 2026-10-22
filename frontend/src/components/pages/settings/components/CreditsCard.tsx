import { Info } from 'lucide-react'
import { Popover } from 'radix-ui'

import { cn } from '@/lib/utils'
import { Button, IconButton } from '@/components/ui/button'
import { SettingsPanel } from './SettingsPanel'

interface CreditsCardProps {
  totalCredits: number
  creditsUsed: number
  creditRefreshDate?: string
  nextRefreshDate?: string
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const Skeleton = ({ className }: { className?: string }) => <div className={cn('animate-pulse rounded-xl bg-white/8', className)} />

// "How credits work" popover, opened from the info button
const CreditsInfo = () => (
  <Popover.Root>
    <Popover.Trigger asChild>
      <IconButton aria-label="How credits work">
        <Info />
      </IconButton>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="z-[60] w-[min(340px,calc(100vw-32px))] animate-sky-in rounded-3xl border border-white/25 bg-night/90 p-5 text-sm leading-[21px] text-white/85 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] backdrop-blur-[24px]"
      >
        <h3 className="m-0 mb-3 font-display text-lg font-medium text-white">How credits work</h3>
        <p className="m-0 mb-1.5 font-medium text-white">Uses credits</p>
        <ul className="m-0 mb-4 flex list-disc flex-col gap-1 ps-5">
          <li>Each message to an agent uses 1 credit</li>
          <li>Each workflow step uses 1 credit</li>
          <li>Each run started by a trigger (a schedule or an app event) uses 1 credit</li>
          <li>Credits reset every month on your reset date</li>
        </ul>
        <p className="m-0 mb-1.5 font-medium text-white">Free</p>
        <ul className="m-0 flex list-disc flex-col gap-1 ps-5">
          <li>Chats with your public (shared) agents</li>
          <li>WhatsApp and Telegram bot conversations</li>
          <li>Viewing and managing agents and workflows</li>
        </ul>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
)

export const CreditsCard = ({ totalCredits, creditsUsed, creditRefreshDate, nextRefreshDate, isLoading, isError = false, onRetry }: CreditsCardProps) => {
  // total_credits is what's left; the period total is left + used
  const periodTotal = totalCredits + creditsUsed
  const usedPct = periodTotal > 0 ? Math.min((creditsUsed / periodTotal) * 100, 100) : 0
  const tone = usedPct >= 100 ? 'bg-off' : usedPct >= 80 ? 'bg-busy' : 'bg-white'

  return (
    <SettingsPanel title="Credits" action={<CreditsInfo />}>
      {isError ? (
        <div className="flex flex-col items-start gap-3 py-4" role="alert">
          <p className="m-0 text-white/72">We couldn't load your credits.</p>
          <Button variant="glass" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3 py-2" aria-busy="true" aria-label="Loading credits">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-2" />
          <Skeleton className="h-14" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
            <p className="m-0">
              <span className="font-display text-[44px] leading-none font-medium tracking-[-0.03em]">{creditsUsed.toLocaleString('en')}</span>
              <span className="ml-2 text-white/66">used of {periodTotal.toLocaleString('en')} this period</span>
            </p>
            <span className="text-sm text-white/72">{totalCredits.toLocaleString('en')} left</span>
          </div>

          <div
            className="my-3 h-2 overflow-hidden rounded-pill bg-white/12"
            role="progressbar"
            aria-label="Credits used this period"
            aria-valuemin={0}
            aria-valuemax={periodTotal}
            aria-valuenow={creditsUsed}
          >
            <div className={cn('h-full rounded-pill transition-[width] duration-500 ease-sky', tone)} style={{ width: `${usedPct}%` }} />
          </div>
          {usedPct >= 80 && (
            <p className={cn('m-0 text-sm', usedPct >= 100 ? 'text-off' : 'text-busy')}>
              {usedPct >= 100 ? 'You have used all your credits for this period.' : 'You have used most of your credits for this period.'}
            </p>
          )}

          {(creditRefreshDate || nextRefreshDate) && (
            <dl className="m-0 mt-2 grid gap-3 sm:grid-cols-2">
              {creditRefreshDate && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <dt className="text-xs text-white/60">Last refreshed</dt>
                  <dd className="m-0 text-sm font-medium">{formatDate(creditRefreshDate)}</dd>
                </div>
              )}
              {nextRefreshDate && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <dt className="text-xs text-white/60">Next refresh</dt>
                  <dd className="m-0 text-sm font-medium">{formatDate(nextRefreshDate)}</dd>
                </div>
              )}
            </dl>
          )}
        </>
      )}
    </SettingsPanel>
  )
}
