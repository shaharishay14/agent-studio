import { useQuery } from '@tanstack/react-query';
import { getAgents } from '../requests';
import type { Agent } from '../types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useGetAgents = () => {
  const { data, isLoading, isError, isSuccess, error, refetch } = useQuery<Agent[], AxiosError<ErrorResponse>>({
    queryKey: ['agents'],
    queryFn: getAgents,
    retry: 1,
  });

  return {
    agents: data,
    isLoading,
    isError,
    isSuccess,
    error,
    refetch,
  };
};

