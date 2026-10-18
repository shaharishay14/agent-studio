import { useEffect } from 'react'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useSearchParams, Link } from 'react-router-dom'
import { AuthLogo } from '../components'
import { useVerifyEmail } from '../hooks'
import useDarkModeStore from '../../../../../store/darkmode.store'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const key = searchParams.get('key') || ''
  const { isDarkMode } = useDarkModeStore()

  const { verifyEmailWithKey, isLoading, isSuccess, isError } = useVerifyEmail()

  useEffect(() => {
    if (key) {
      verifyEmailWithKey(key)
    }
  }, [key, verifyEmailWithKey])

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
    }`}>
      <div className="w-full max-w-md">
        <AuthLogo />

        <div className={`border rounded-xl p-6 md:p-8 ${
          isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-purple-200 shadow-lg'
        }`}>
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Verifying your email...</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Email verified!</h3>
              <p className={`text-sm mb-6 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Your email has been successfully verified. Redirecting to sign in...
              </p>
              <Link 
                to="/auth/signin" 
                className={`inline-block transition-colors ${
                  isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                }`}
              >
                Continue to sign in →
              </Link>
            </div>
          )}

          {isError && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Verification failed</h3>
              <p className={`text-sm mb-6 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                The verification link is invalid or has expired. Please try signing up again.
              </p>
              <Link 
                to="/auth/signup" 
                className={`inline-block transition-colors ${
                  isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                }`}
              >
                Back to sign up →
              </Link>
            </div>
          )}

          {!key && !isLoading && (
            <div className="text-center py-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDarkMode ? 'bg-gray-500/10' : 'bg-gray-200'
              }`}>
                <Mail className={`w-8 h-8 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-600'
                }`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>No verification key</h3>
              <p className={`text-sm mb-6 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Please use the verification link sent to your email.
              </p>
              <Link 
                to="/auth/signin" 
                className={`inline-block transition-colors ${
                  isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                }`}
              >
                Back to sign in →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail

