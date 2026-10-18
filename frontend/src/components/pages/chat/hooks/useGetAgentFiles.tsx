import { useQuery } from '@tanstack/react-query';
import { getAgentFiles } from '../requests';
import type { AgentFile } from '../types';

export const useGetAgentFiles = (agentId: string | undefined, enabled: boolean = true) => {
  const { data: uploadedFiles = [], isLoading, isError, error, refetch } = useQuery<AgentFile[]>({
    queryKey: ['agent-files', agentId],
    queryFn: () => getAgentFiles(agentId || ''),
    enabled: !!agentId && enabled,
  });

  return {
    uploadedFiles,
    isLoading,
    isError,
    error,
    refetch,
  };
};

