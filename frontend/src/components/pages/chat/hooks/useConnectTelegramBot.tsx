import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { connectTelegramBot } from '../requests';
import type { ConnectTelegramBotRequest, TelegramBotResponse } from '../types';

export const useConnectTelegramBot = (agentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConnectTelegramBotRequest): Promise<TelegramBotResponse> => {
      return await connectTelegramBot(agentId, data);
    },
    onSuccess: () => {
      toast.success('Bot connected to Telegram successfully!');
      // עדכון cache אם צריך
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent-telegram', agentId] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          'Error connecting bot';
      toast.error(errorMessage);
    },
  });
};

