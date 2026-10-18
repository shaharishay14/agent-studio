import { Mail, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthLogo, AuthHeader, AuthInput, SubmitButton } from '../components'
import { useForgotPassword } from '../hooks'
import useDarkModeStore from '../../../../../store/darkmode.store'

function ForgotPassword() {
  const { register, handleSubmit, errors, onSubmit, isLoading, isSuccess } = useForgotPassword()
  const { isDarkMode } = useDarkModeStore()

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
    }`}>
      <div className="w-full max-w-md">

        <AuthLogo />
        
        <AuthHeader 
          title="Forgot your password?"
          subtitle="Enter your email and we'll send you a reset link"
        />

        <div className={`border rounded-xl p-6 md:p-8 ${
          isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-purple-200 shadow-lg'
        }`}>
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-500" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Check your email</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                We've sent you a password reset link. Please check your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <AuthInput
                id="email"
                label="Email address"
                type="email"
                placeholder="Enter your email"
                icon={Mail}
                register={register('email')}
                error={errors.email?.message}
              />

              <SubmitButton
                isLoading={isLoading}
                loadingText="Sending..."
                text="Send reset link"
                icon={Send}
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
              Remember your password? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

