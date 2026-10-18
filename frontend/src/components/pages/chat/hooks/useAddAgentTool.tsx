import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addAgentTool } from '../requests';
import type { AddAgentToolPayload, AddAgentToolResponse } from '../types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useAddAgentTool = (agentId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<AddAgentToolResponse, AxiosError<ErrorResponse>, AddAgentToolPayload>({
    mutationFn: (payload) => addAgentTool(agentId, payload),
    onSuccess: (data) => {
      // Invalidate queries to refetch the updated tools
      queryClient.invalidateQueries({ queryKey: ['combinedAvailableTools', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      
      console.log('Tool added successfully:', data);
    },
    onError: (error) => {
      console.error('Error adding tool:', error.response?.data?.message || error.message);
    },
  });

  const handleAddTool = (toolName: string) => {
    if (!agentId) {
      console.error('Agent ID is required');
      return;
    }
    
    mutation.mutate({ tool_name: toolName });
  };

  return {
    handleAddTool,
    mutateAsync: mutation.mutateAsync,
    isAdding: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
};

