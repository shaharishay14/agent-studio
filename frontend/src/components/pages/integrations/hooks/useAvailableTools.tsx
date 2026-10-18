import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAvailableTools } from '../requests';
import { mapToolsToIntegrations } from '../utils';
import type { AvailableToolsResponse } from '../types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useAvailableTools = () => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AvailableToolsResponse, AxiosError<ErrorResponse>>({
    queryKey: ['availableTools'],
    queryFn: fetchAvailableTools,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 דקות
  });

  // המרת הכלים מהשרת לפורמט של אינטגרציות
  const integrations = useMemo(() => {
    if (!data?.tools) return [];
    return mapToolsToIntegrations(data.tools);
  }, [data?.tools]);

  return {
    tools: data?.tools,
    integrations,
    count: data?.count,
    isLoading,
    isError,
    error,
    refetch,
  };
};

