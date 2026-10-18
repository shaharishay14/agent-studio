import { useQuery } from '@tanstack/react-query'
import { getCreditsBalance, type CreditsBalance } from '../requests'
import type { AxiosError } from 'axios'

interface ErrorResponse {
  message: string
}

export const useGetCredits = () => {
  const { data, isLoading, isError, error, refetch } = useQuery<CreditsBalance, AxiosError<ErrorResponse>>({
    queryKey: ['credits-balance'],
    queryFn: getCreditsBalance,
    retry: 1,
  })

  return {
    credits: data,
    isLoading,
    isError,
    error,
    refetch,
  }
}

