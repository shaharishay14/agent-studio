import { Button } from '@/components/ui/button'
import { AuthShell, AuthDivider, SocialButtons, AuthFooterLink, SigninForm } from './components'
import { useLogin, useProviders } from './hooks'

function Signin() {
  const { register, handleSubmit, errors, onSubmit, isLoading } = useLogin()
  const { handleGoogleLogin, handleGithubLogin, isLoading: isProviderLoading } = useProviders()

  return (
    <AuthShell title="Welcome" accent="back" subtitle="Sign in to your agents.">
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
