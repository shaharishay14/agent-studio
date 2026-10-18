import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { disconnectTelegramBot } from '../requests';

export const useDisconnectTelegramBot = (agentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await disconnectTelegramBot(agentId);
    },
    onSuccess: () => {
      toast.success('Bot disconnected from Telegram successfully');
      // עדכון cache
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      queryClient.setQueryData(['agent-telegram', agentId], null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          'Error disconnecting bot';
      toast.error(errorMessage);
    },
  });
};

