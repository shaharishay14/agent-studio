import { Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthShell, AuthInput, AuthStatus, AuthFooterLink } from '../components'
import { useForgotPassword } from '../hooks'

function ForgotPassword() {
  const { register, handleSubmit, errors, onSubmit, isLoading, isSuccess } = useForgotPassword()

  if (isSuccess) {
    return (
      <AuthShell>
        <AuthStatus tone="success" icon={<Send />} title="Check your email" action={{ label: 'Back to sign in', to: '/auth/signin' }}>
          We've sent you a password reset link. It can take a minute to arrive; check your spam folder too.
        </AuthStatus>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Forgot your" accent="password?" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[22px]" noValidate>
        <AuthInput
          id="email"
          label="Email"
          type="email"
          placeholder="name@company.com"
          icon={<Mail />}
          autoComplete="email"
          register={register('email')}
          error={errors.email?.message}
        />
        <Button type="submit" block loading={isLoading}>
          {isLoading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <AuthFooterLink text="Remember your password?" linkText="Sign in" linkTo="/auth/signin" />
    </AuthShell>
  )
}

export default ForgotPassword
