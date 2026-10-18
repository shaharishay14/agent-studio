import { useQuery } from '@tanstack/react-query';
import { fetchConnections } from '../requests';

export const useGetConnections = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['connections'],
    queryFn: fetchConnections,
  });

  console.log('📊 Connections data:', data);

  return {
    connections: data,
    isLoading,
    isError,
    error,
  };
};

