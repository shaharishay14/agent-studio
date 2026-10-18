import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'sonner'
import { resetPasswordSchema } from '../schema'
import { resetPassword, type ResetPasswordResponse } from '../requests'
import type { ResetPasswordFormData } from '../types'
import type { AxiosError } from 'axios'

interface ErrorResponse {
  message?: string
  detail?: string
  password?: string[]
}

export const useResetPassword = (uid: string, token: string) => {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      uid,
      token,
    },
  })

  const {
    mutateAsync,
    isPending: isLoading,
    isError,
    error,
    isSuccess,
  } = useMutation<ResetPasswordResponse, AxiosError<ErrorResponse>, ResetPasswordFormData>({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      console.log('Password reset successful:', data.detail)
      toast.success('Password reset successful! Redirecting to login...')
      // הצלחה - ניתוב לדף התחברות
      setTimeout(() => {
        navigate('/auth/signin')
      }, 2000)
    },
    onError: (error) => {
      const message = error.response?.data?.password?.[0] || error.response?.data?.detail || error.response?.data?.message || error.message || 'An error occurred while resetting the password. Please try again.'
      console.error('Reset password error:', message)
      toast.error(message)
    },
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    await mutateAsync(data)
  }

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isLoading,
    isError,
    error,
    isSuccess,
    setValue,
  }
}

