import { useQuery } from '@tanstack/react-query';
import { getPublicAgent } from '../requests';
import type { Agent } from '../../chat/types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useGetPublicAgent = (id: string) => {
  const { data: agent, isLoading, isError, isSuccess, error, refetch } = useQuery<Agent, AxiosError<ErrorResponse>>({
    queryKey: ['public-agent', id],
    queryFn: () => getPublicAgent(id),
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

