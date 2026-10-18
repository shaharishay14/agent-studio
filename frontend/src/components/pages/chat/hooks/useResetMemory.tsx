import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resetAgentMemory } from '../requests';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useResetMemory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (agentId: string) => resetAgentMemory(agentId),
    onSuccess: async (_, agentId) => {
      // Invalidate messages query to refetch
      await queryClient.invalidateQueries({ queryKey: ['messages', agentId] });
      toast.success('Memory reset successfully! 🔄');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to reset memory';
      toast.error(errorMessage);
    },
  });
  
  return {
    resetMemory: mutation.mutate,
    isResetting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
};

