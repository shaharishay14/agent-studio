import { Button } from '@/components/ui/button'
import { AuthShell, AuthDivider, SocialButtons, AuthFooterLink, SignupForm } from './components'
import { useRegister, useProviders } from './hooks'

function Signup() {
  const { register, handleSubmit, errors, onSubmit, isLoading } = useRegister()
  const { handleGoogleLogin, handleGithubLogin, isLoading: isProviderLoading } = useProviders()

  return (
    <AuthShell title="Create your" accent="account" subtitle="Free while Agent Studio is in early access.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[22px]" noValidate>
        <SignupForm register={register} errors={errors} />
        <Button type="submit" block loading={isLoading || isProviderLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <AuthDivider />

      <SocialButtons onGoogleClick={handleGoogleLogin} onGithubClick={handleGithubLogin} disabled={isLoading || isProviderLoading} />

      <AuthFooterLink text="Already have an account?" linkText="Sign in" linkTo="/auth/signin" />
    </AuthShell>
  )
}

export default Signup
