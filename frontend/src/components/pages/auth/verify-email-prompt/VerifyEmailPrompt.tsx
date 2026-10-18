import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Send, Clock } from 'lucide-react'
import useDarkModeStore from '../../../../../store/darkmode.store'
import { useResendVerification } from '../hooks/useResendVerification'

function VerifyEmailPrompt() {
  const { isDarkMode } = useDarkModeStore()
  const { resendEmail, isLoading } = useResendVerification()
  const [email, setEmail] = useState('')
  const [countdown, setCountdown] = useState(0)

  // טעינת email מ-localStorage (נשמור אותו כשנכנסים לעמוד)
  useEffect(() => {
    const savedEmail = localStorage.getItem('verificationEmail')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendEmail = async () => {
    if (!email) {
      return
    }
    await resendEmail(email)
    setCountdown(40) // התחל ספירה לאחור של 40 שניות
  }

  const isButtonDisabled = countdown > 0 || isLoading || !email

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-[#0a0a0a] to-gray-900' 
        : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
    }`}>
      <div className="w-full max-w-md">

        {/* Card */}
        <div className={`rounded-2xl shadow-2xl border backdrop-blur-sm transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-900/90 border-gray-800 shadow-purple-900/20' 
            : 'bg-white/80 border-purple-200 shadow-purple-200/50'
        }`}>
          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
                  : 'bg-gradient-to-br from-purple-100 to-pink-100'
              }`}>
                <Mail className={`w-10 h-10 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
            </div>

            {/* Title */}
            <h1 className={`text-3xl font-bold text-center mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Verify Your Email
            </h1>

            {/* Description */}
            <p className={`text-center mb-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              We've sent a verification email to{' '}
              <span className={`font-semibold ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                {email || 'your email'}
              </span>
              . Please check your inbox and click the verification link.
            </p>

            {/* Email Input (for manual entry if needed) */}
            {!email && (
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                  }`}
                />
              </div>
            )}

            {/* Resend Button */}
            <button
              onClick={handleResendEmail}
              disabled={isButtonDisabled}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                isButtonDisabled
                  ? isDarkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 text-white hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105'
                    : 'bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105'
              }`}
            >
              {countdown > 0 ? (
                <>
                  <Clock className="w-5 h-5" />
                  Resend in {countdown}s
                </>
              ) : isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Verification Email
                </>
              )}
            </button>

            {/* Help Text */}
            <div className={`mt-6 p-4 rounded-lg ${
              isDarkMode 
                ? 'bg-purple-500/10 border border-purple-500/20' 
                : 'bg-purple-50 border border-purple-200'
            }`}>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <strong>Didn't receive the email?</strong>
                <br />
                Check your spam folder or click the button above to resend.
              </p>
            </div>

            {/* Footer Link */}
            <div className="mt-6 text-center">
              <Link 
                to="/auth/signin"
                className={`text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'text-purple-400 hover:text-purple-300'
                    : 'text-purple-600 hover:text-purple-700'
                }`}
              >
                Already verified? Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPrompt

