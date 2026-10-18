import { useQuery } from '@tanstack/react-query';
import { getAgent } from '../requests';
import type { Agent } from '../types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useGetAgent = (id: string) => {
  const { data: agent, isLoading, isError, isSuccess, error, refetch } = useQuery<Agent, AxiosError<ErrorResponse>>({
    queryKey: ['agent', id],
    queryFn: () => getAgent(id),
    retry: 1,
    enabled: !!id, // רק אם יש id תבצע את הבקשה
  });

  return {
    agent,
    isLoading,
    isError,
    isSuccess,
    error,
    refetch,
  };
};

