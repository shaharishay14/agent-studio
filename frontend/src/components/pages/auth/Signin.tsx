import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthShell, AuthDivider, SocialButtons, AuthFooterLink, SigninForm } from './components'
import { useLogin, useProviders } from './hooks'

function Signin() {
  const { register, handleSubmit, errors, onSubmit, isLoading } = useLogin()
  const { handleGoogleLogin, handleGithubLogin, isLoading: isProviderLoading } = useProviders()

  return (
    <AuthShell title="Welcome" accent="back" subtitle="Sign in to your agents.">
      {/* Continue creating your agent after signing in */}
      <p className="m-0 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/6 py-2 pr-4 pl-2 text-[13px] leading-[18px] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
        <span className="grid size-8 shrink-0 place-items-center rounded-pill border border-white/30 bg-white/10" aria-hidden="true">
          <Sparkles className="size-3.5" strokeWidth={1.7} />
        </span>
        Continue creating your agent after signing in
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[22px]" noValidate>
        <SigninForm register={register} errors={errors} />
        <Button type="submit" block loading={isLoading || isProviderLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <AuthDivider />

      <SocialButtons onGoogleClick={handleGoogleLogin} onGithubClick={handleGithubLogin} disabled={isLoading || isProviderLoading} />

      <AuthFooterLink text="New here?" linkText="Create an account" linkTo="/auth/signup" />
    </AuthShell>
  )
}

export default Signin
