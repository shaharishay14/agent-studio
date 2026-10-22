import { useEffect } from 'react'
import { Mail, CheckCircle, XCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { AuthShell, AuthStatus } from '../components'
import { useVerifyEmail } from '../hooks'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const key = searchParams.get('key') || ''
  const { verifyEmailWithKey, isLoading, isSuccess, isError } = useVerifyEmail()

  useEffect(() => {
    if (key) {
      verifyEmailWithKey(key)
    }
  }, [key, verifyEmailWithKey])

  return (
    <AuthShell>
      {isLoading && (
        <AuthStatus tone="loading" title="Verifying your email…">
          This only takes a moment.
        </AuthStatus>
      )}

      {isSuccess && (
        <AuthStatus tone="success" icon={<CheckCircle />} title="Email verified" action={{ label: 'Continue to sign in', to: '/auth/signin' }}>
          Your email is confirmed. Redirecting you to sign in…
        </AuthStatus>
      )}

      {isError && (
        <AuthStatus tone="error" icon={<XCircle />} title="Verification failed" action={{ label: 'Back to sign up', to: '/auth/signup' }}>
          The verification link is invalid or has expired. Please sign up again.
        </AuthStatus>
      )}

      {!key && !isLoading && (
        <AuthStatus tone="info" icon={<Mail />} title="No verification key" action={{ label: 'Back to sign in', to: '/auth/signin' }}>
          Open the verification link from the email we sent you.
        </AuthStatus>
      )}
    </AuthShell>
  )
}

export default VerifyEmail
