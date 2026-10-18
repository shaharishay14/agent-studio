import { useQuery } from '@tanstack/react-query';
import { getAgentMessages } from '../requests';
import type { Message } from '../types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useGetAgentMessages = (id: string) => {
  const { data, isLoading, isError, isSuccess, error, refetch } = useQuery<Message[], AxiosError<ErrorResponse>>({
    queryKey: ['agent-messages', id],
    queryFn: () => getAgentMessages(id),
    retry: 1,
    enabled: !!id, // רק אם יש id תבצע את הבקשה
  });

  const messages = data || [];

  return {
    messages,
    isLoading,
    isError,
    isSuccess,
    error,
    refetch,
  };
};

