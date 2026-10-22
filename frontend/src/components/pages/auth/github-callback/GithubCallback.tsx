import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AuthShell, AuthStatus } from '../components'

function GithubCallback() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('GitHub OAuth error:', error)
      // שליחת הודעת שגיאה לחלון האב
      if (window.opener) {
        window.opener.postMessage(
          { type: 'github-auth', error },
          window.location.origin
        )
        window.close()
      }
      return
    }

    if (code) {
      console.log('GitHub code received:', code)
      // שליחת הקוד לחלון האב
      if (window.opener) {
        window.opener.postMessage(
          { type: 'github-auth', code },
          window.location.origin
        )
        // החלון ייסגר על ידי החלון האב
      }
    }
  }, [searchParams])

  return (
    <AuthShell>
      <AuthStatus tone="loading" title="Signing you in with GitHub…">
        This window closes by itself when it's done.
      </AuthStatus>
    </AuthShell>
  )
}

export default GithubCallback
