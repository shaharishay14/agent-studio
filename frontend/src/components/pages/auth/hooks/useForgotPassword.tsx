import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'sonner'
import { forgotPasswordSchema } from '../schema'
import { forgotPassword, type ForgotPasswordResponse } from '../requests'
import type { ForgotPasswordFormData } from '../types'
import type { AxiosError } from 'axios'

interface ErrorResponse {
  message: string
}

export const useForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
  })

  const {
    mutateAsync,
    isPending: isLoading,
    isError,
    error,
    isSuccess,
  } = useMutation<ForgotPasswordResponse, AxiosError<ErrorResponse>, ForgotPasswordFormData>({
    mutationFn: forgotPassword,
    onSuccess: (data) => {
      console.log('Password reset email sent:', data.detail)
      toast.success('Password reset email sent! Please check your inbox.')
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Failed to send reset email'
      console.error('Forgot password error:', message)
      toast.error(message)
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
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
  }
}

