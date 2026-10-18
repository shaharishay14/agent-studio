import { useQuery } from '@tanstack/react-query';
import { fetchConnectionsForDisplay } from '../requests';

export const useGetConnectionsForDisplay = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['connectionsForDisplay'],
    queryFn: fetchConnectionsForDisplay,
  });

  return {
    connectionsForDisplay: data,
    isLoading,
    isError,
    error,
  };
};

