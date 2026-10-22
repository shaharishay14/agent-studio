import { useGetCredits } from './hooks'
import { AccountInformation, CreditsCard } from './components'
import { HeaderBand } from '../../sky/HeaderBand'
import { BlurFade } from '@/components/ui/blur-fade'

function Settings() {
  const { credits, isLoading: isLoadingCredits, isError: isCreditsError, refetch } = useGetCredits()

  return (
    <div className="min-h-screen bg-night text-white">
      <HeaderBand eyebrow="Settings" title="Your" accent="account" subtitle="Your profile, plan and monthly credits." />

      <main className="mx-auto max-w-[1280px] px-4 pt-4 pb-20 sm:px-6 lg:px-10">
        <BlurFade className="grid gap-5 lg:grid-cols-2">
          <AccountInformation />

          <CreditsCard
            totalCredits={credits?.total_credits ?? 0}
            creditsUsed={credits?.credits_used ?? 0}
            creditRefreshDate={credits?.credit_refresh_date}
            nextRefreshDate={credits?.next_refresh_date}
            isLoading={isLoadingCredits}
            isError={isCreditsError}
            onRetry={() => refetch()}
          />
        </BlurFade>
      </main>
    </div>
  )
}

export default Settings
