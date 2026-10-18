import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { verifyEmail, type VerifyEmailResponse } from '../requests'
import type { VerifyEmailFormData } from '../types'
import type { AxiosError } from 'axios'

interface ErrorResponse {
  message: string
}

export const useVerifyEmail = () => {
  const navigate = useNavigate()

  const {
    mutateAsync,
    isPending: isLoading,
    isError,
    error,
    isSuccess,
  } = useMutation<VerifyEmailResponse, AxiosError<ErrorResponse>, VerifyEmailFormData>({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      console.log('Email verified:', data.detail)
      toast.success('Email verified successfully! Redirecting to login...')
      // הצלחה - ניתוב לדף התחברות
      setTimeout(() => {
        navigate('/auth/signin')
      }, 2000)
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Failed to verify email'
      console.error('Verify email error:', message)
      toast.error(message)
    },
  })

  const verifyEmailWithKey = async (key: string) => {
    await mutateAsync({ key })
  }

  return {
    verifyEmailWithKey,
    isLoading,
    isError,
    error,
    isSuccess,
  }
}

