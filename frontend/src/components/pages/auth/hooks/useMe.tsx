import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useUserStore } from '../../../../../store/user.store'
import { fetchMe, type User } from '../requests'
import type { AxiosError } from 'axios'

interface ErrorResponse {
  message: string
}

export const useMe = () => {
  const {setUser, setIsAuthenticated} = useUserStore((state) => state)

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User, AxiosError<ErrorResponse>>({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 דקות
  })

  // שמירת המשתמש ב-store כשהנתונים מתקבלים
  useEffect(() => {
    if (data) {
      setUser(data)
      setIsAuthenticated(true)
    }
  }, [data, setUser, setIsAuthenticated])

  return {
    user: data,
    isLoading,
    isError,
    error,
    refetch,
  }
}

