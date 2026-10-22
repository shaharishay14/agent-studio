import { useState, useEffect } from 'react'
import { Clock, Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PillInput } from '@/components/ui/pill-input'
import { AuthShell, AuthFooterLink } from '../components'
import { useResendVerification } from '../hooks/useResendVerification'

function VerifyEmailPrompt() {
  const { resendEmail, isLoading } = useResendVerification()
  const [email, setEmail] = useState('')
  const [hasSavedEmail, setHasSavedEmail] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // טעינת email מ-localStorage (נשמור אותו כשנכנסים לעמוד)
  useEffect(() => {
    const savedEmail = localStorage.getItem('verificationEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setHasSavedEmail(true)
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
    <AuthShell
      title="Check your"
      accent="inbox"
      subtitle={
        hasSavedEmail ? (
          <>
            We sent a verification link to <span className="font-medium text-white">{email}</span>. Open it to finish
            signing up.
          </>
        ) : (
          'We sent you a verification link. Open it to finish signing up.'
        )
      }
    >
      {!hasSavedEmail && (
        <PillInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          icon={<Mail />}
          autoComplete="email"
          helper="Enter the address you signed up with to get a new link."
        />
      )}

      <Button block onClick={handleResendEmail} disabled={isButtonDisabled} loading={isLoading} aria-live="polite">
        {countdown > 0 ? (
          <>
            <Clock />
            Resend in {countdown}s
          </>
        ) : isLoading ? (
          'Sending…'
        ) : (
          <>
            <Send />
            Send the link again
          </>
        )}
      </Button>

      <div className="rounded-inner border border-white/12 bg-white/5 px-5 py-4 text-sm leading-[22px] text-white/72">
        <b className="font-medium text-white">Didn't get it?</b> Check your spam folder, or send the link again.
      </div>

      <AuthFooterLink text="Already verified?" linkText="Sign in" linkTo="/auth/signin" />
    </AuthShell>
  )
}

export default VerifyEmailPrompt
