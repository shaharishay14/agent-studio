import { useQuery } from '@tanstack/react-query';
import { getTemplates } from '../requests';
import type { AxiosError } from 'axios';
import type { ServerTemplateCategory } from '../types';

interface ErrorResponse {
  message: string;
}

export const useGetTemplates = () => {
  const query = useQuery<ServerTemplateCategory[], AxiosError<ErrorResponse>>({
    queryKey: ['templates'],
    queryFn: getTemplates,
  });

  return {
    templates: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
};

