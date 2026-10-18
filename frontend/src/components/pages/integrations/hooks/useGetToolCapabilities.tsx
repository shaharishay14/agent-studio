import { useQuery } from '@tanstack/react-query';
import { fetchToolCapabilities } from '../requests';

export const useGetToolCapabilities = (toolName: string | null) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['toolCapabilities', toolName],
    queryFn: () => fetchToolCapabilities(toolName!),
    enabled: !!toolName, // רק אם יש toolName
    staleTime: 5 * 60 * 1000, // 5 דקות
  });

  return {
    capabilities: data,
    isLoading,
    isError,
    error,
  };
};

