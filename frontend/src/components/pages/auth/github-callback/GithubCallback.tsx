import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthLogo } from '../components'
import useDarkModeStore from '../../../../../store/darkmode.store'

function GithubCallback() {
  const [searchParams] = useSearchParams()
  const { isDarkMode } = useDarkModeStore()

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
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
    }`}>
      <div className="w-full max-w-md text-center">
        <AuthLogo />
        
        <div className={`border rounded-xl p-6 md:p-8 ${
          isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-purple-200 shadow-lg'
        }`}>
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <h3 className={`text-xl font-semibold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Completing GitHub authentication...
          </h3>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Please wait while we process your login.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GithubCallback

