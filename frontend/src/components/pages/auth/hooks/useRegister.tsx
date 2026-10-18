import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'sonner'
import { signupSchema } from '../schema'
import { useUserStore } from '../../../../../store/user.store'
import { registerUser, type RegisterResponse } from '../requests'
import type { SignupFormData } from '../types'
import type { AxiosError } from 'axios'

interface ErrorResponse {
  message: string
}

export const useRegister = () => {
  const navigate = useNavigate()
  const {setUser, setIsAuthenticated} = useUserStore((state) => state)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
  })

  const {
    mutateAsync,
    isPending: isLoading,
    isError,
    error,
    isSuccess,
  } = useMutation<RegisterResponse, AxiosError<ErrorResponse>, SignupFormData>({
    mutationFn: registerUser,
    onSuccess: (data) => {
      // שמירת המשתמש ב-store
      setUser(data.user)
      setIsAuthenticated(true)
      // ה-tokens נשמרים אוטומטית ב-cookies על ידי הדפדפן
      // data.access - access token
      // data.refresh - refresh token
      
      // הצגת הודעת הצלחה
      toast.success('Registration successful! Welcome to Agent Studio')
      
      // ניווט לדף הbuilder
      navigate('/builder')
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Registration failed'
      console.error('Registration error:', message)
      toast.error(message)
    },
  })

  const onSubmit = async (data: SignupFormData) => {
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

