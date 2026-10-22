import { AuthShell, AuthStatus } from '../components'

// Google sign-in runs in a popup (useGoogleLogin), so nothing completes on this route;
// it only shows a neutral state with a way back.
function GoogleCallback() {
  return (
    <AuthShell>
      <AuthStatus tone="loading" title="Signing you in with Google…" action={{ label: 'Back to sign in', to: '/auth/signin' }}>
        If this window doesn't close by itself, go back and try again.
      </AuthStatus>
    </AuthShell>
  )
}

export default GoogleCallback
