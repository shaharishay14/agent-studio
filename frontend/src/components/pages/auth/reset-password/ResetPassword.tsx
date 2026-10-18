import { KeyRound, CheckCircle } from 'lucide-react'
import { useSearchParams, Link } from 'react-router-dom'
import { AuthLogo, AuthHeader, PasswordInput, SubmitButton } from '../components'
import { useResetPassword } from '../hooks'
import useDarkModeStore from '../../../../../store/darkmode.store'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const { isDarkMode } = useDarkModeStore()

  const { register, handleSubmit, errors, onSubmit, isLoading, isSuccess } = useResetPassword(uid, token)

  if (!uid || !token) {
    return (
      <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
      }`}>
        <div className="w-full max-w-md">
          <AuthLogo />
          <div className={`border rounded-xl p-6 md:p-8 text-center ${
            isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-purple-200 shadow-lg'
          }`}>
            <h3 className={`text-xl font-semibold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Invalid reset link</h3>
            <p className={`text-sm mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              This password reset link is invalid or has expired.
            </p>
            <Link 
              to="/auth/forgot-password" 
              className={`transition-colors ${
                isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
              }`}
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
    }`}>
      <div className="w-full max-w-md">
        <AuthLogo />
        
        <AuthHeader 
          title="Reset your password"
          subtitle="Enter your new password below"
        />

        <div className={`border rounded-xl p-6 md:p-8 ${
          isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-purple-200 shadow-lg'
        }`}>
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Password reset successful!</h3>
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Redirecting to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <PasswordInput
                id="password"
                label="New password"
                placeholder="Enter new password"
                register={register('password')}
                error={errors.password?.message}
                helperText="Must be at least 6 characters long"
              />

              <PasswordInput
                id="password_confirm"
                label="Confirm new password"
                placeholder="Confirm new password"
                register={register('password_confirm')}
                error={errors.password_confirm?.message}
              />

              <SubmitButton
                isLoading={isLoading}
                loadingText="Resetting..."
                text="Reset password"
                icon={KeyRound}
              />
            </form>
          )}

          <div className="mt-6 text-center">
            <Link 
              to="/auth/signin" 
              className={`text-sm transition-colors ${
                isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
              }`}
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

