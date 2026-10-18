import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeAgentTool } from '../requests';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useRemoveAgentTool = (agentId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (toolName) => removeAgentTool(agentId, toolName),
    onSuccess: (_, toolName) => {
      // Invalidate queries to refetch the updated tools
      queryClient.invalidateQueries({ queryKey: ['combinedAvailableTools', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      
      console.log('Tool removed successfully:', toolName);
    },
    onError: (error, toolName) => {
      console.error('Error removing tool:', toolName, error.response?.data?.message || error.message);
    },
  });

  const handleRemoveTool = (toolName: string) => {
    if (!agentId) {
      console.error('Agent ID is required');
      return;
    }
    
    mutation.mutate(toolName);
  };

  return {
    handleRemoveTool,
    mutateAsync: mutation.mutateAsync,
    isRemoving: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
};

