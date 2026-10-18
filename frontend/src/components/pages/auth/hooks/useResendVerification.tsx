import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resendVerificationEmail, type ResendVerificationResponse } from '../requests'
import type { AxiosError } from 'axios'

interface ErrorResponse {
  message: string
}

export const useResendVerification = () => {
  const {
    mutateAsync,
    isPending: isLoading,
    isError,
    error,
    isSuccess,
  } = useMutation<ResendVerificationResponse, AxiosError<ErrorResponse>, string>({
    mutationFn: resendVerificationEmail,
    onSuccess: () => {
      toast.success('Verification email sent! Please check your inbox.')
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Failed to send verification email'
      console.error('Resend verification error:', message)
      toast.error(message)
    },
  })

  const resendEmail = async (email: string) => {
    await mutateAsync(email)
  }

  return {
    resendEmail,
    isLoading,
    isError,
    error,
    isSuccess,
  }
}

