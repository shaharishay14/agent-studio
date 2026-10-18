import { useQuery } from '@tanstack/react-query';
import { getAvailableTools, getAvailableAgentTools } from '../requests';
import { useMemo } from 'react';
import type { AvailableToolsResponse, AvailableAgentToolsResponse } from '../types';
import { unifyTools } from '../utils';

interface CombinedToolsResponse {
  availableTools: AvailableToolsResponse;
  availableAgentTools: AvailableAgentToolsResponse;
}

export const useGetAvailableAgentTools = (id: string) => {
  // שליחת שתי בקשות במקביל עם Promise.all
  const { data, isLoading, isError, isSuccess, error, refetch } = useQuery<CombinedToolsResponse>({
    queryKey: ['combinedAvailableTools', id],
    queryFn: async () => {
      const [availableTools, availableAgentTools] = await Promise.all([
        getAvailableTools(id),
        getAvailableAgentTools(id),
      ]);
      
      return {
        availableTools,
        availableAgentTools,
      };
    },
    retry: 1,
    enabled: !!id,
  });

  // איחוד הנתונים לפורמט משותף
  const unifiedTools = useMemo(() => {
    if (!data) {
      return [];
    }

    return unifyTools({
      availableTools: data.availableTools,
      availableAgentTools: data.availableAgentTools,
    });
  }, [data]);

  return {
    data: unifiedTools,
    isLoading,
    isError,
    isSuccess,
    error,
    refetch,
  };
};

