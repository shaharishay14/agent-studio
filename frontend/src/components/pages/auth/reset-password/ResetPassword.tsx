import { CheckCircle, Link2Off } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AuthShell, AuthStatus, PasswordInput, AuthFooterLink } from '../components'
import { useResetPassword } from '../hooks'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const { register, handleSubmit, errors, onSubmit, isLoading, isSuccess } = useResetPassword(uid, token)

  if (!uid || !token) {
    return (
      <AuthShell>
        <AuthStatus tone="error" icon={<Link2Off />} title="This link doesn't work" action={{ label: 'Request a new link', to: '/auth/forgot-password' }}>
          This password reset link is invalid or has expired.
        </AuthStatus>
      </AuthShell>
    )
  }

  if (isSuccess) {
    return (
      <AuthShell>
        <AuthStatus tone="success" icon={<CheckCircle />} title="Password changed" action={{ label: 'Sign in', to: '/auth/signin' }}>
          Redirecting you to sign in…
        </AuthStatus>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset your" accent="password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[22px]" noValidate>
        <div className="flex flex-col gap-[18px]">
          <PasswordInput
            id="password"
            label="New password"
            placeholder="Create a password"
            autoComplete="new-password"
            register={register('password')}
            error={errors.password?.message}
            helperText="At least 8 characters"
          />
          <PasswordInput
            id="password_confirm"
            label="Confirm new password"
            placeholder="Type it again"
            autoComplete="new-password"
            register={register('password_confirm')}
            error={errors.password_confirm?.message}
          />
        </div>
        <Button type="submit" block loading={isLoading}>
          {isLoading ? 'Saving…' : 'Reset password'}
        </Button>
      </form>

      <AuthFooterLink text="Changed your mind?" linkText="Back to sign in" linkTo="/auth/signin" />
    </AuthShell>
  )
}

export default ResetPassword
