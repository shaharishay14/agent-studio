import { useQuery } from '@tanstack/react-query';
import { getTelegramBot } from '../requests';
import type { TelegramBotResponse } from '../types';

export const useGetTelegramBot = (agentId: string | null) => {
  return useQuery<TelegramBotResponse | null>({
    queryKey: ['agent-telegram', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      
      try {
        const bots = await getTelegramBot(agentId);
        // מחזירים את הבוט הראשון במערך (בדרך כלל יהיה רק אחד)
        // או null אם המערך ריק
        return bots.length > 0 ? bots[0] : null;
      } catch (error: any) {
        // אם אין בוט מחובר, השרת יחזיר 404 או מערך ריק
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!agentId,
  });
};

