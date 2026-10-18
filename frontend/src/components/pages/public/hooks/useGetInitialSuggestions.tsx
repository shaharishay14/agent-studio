import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSuggestedPrompts } from '../../chat/requests';
import type { SuggestedPromptsPayload, SuggestedPromptsResponse, Agent } from '../../chat/types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useGetInitialSuggestions = (agent?: Agent, hasMessages: boolean = false) => {
  const { mutateAsync, isPending, data } = useMutation<
    SuggestedPromptsResponse,
    AxiosError<ErrorResponse>,
    SuggestedPromptsPayload
  >({
    mutationFn: (payload) => getSuggestedPrompts(payload),
    onError: () => {
      // שקט - לא נציג שגיאות למשתמשי PublicChat
      console.log('לא ניתן לקבל הצעות מותאמות, משתמש בהצעות ברירת מחדל');
    },
  });

  // קריאה להצעות רק פעם אחת בהתחלה אם אין הודעות
  useEffect(() => {
    const fetchInitialSuggestions = async () => {
      if (agent && !hasMessages && !isPending) {
        try {
          // שימוש ב-prompt של ה-agent (שהוא התיאור שלו) כבסיס להצעות
          await mutateAsync({
            prompt: agent.prompt || 'Hello, how can I help you?',
            app_connections: agent.app_connections || []
          });
        } catch (error) {
          // שקט - השגיאה כבר מטופלת ב-onError
        }
      }
    };
    
    fetchInitialSuggestions();
  }, [agent?.id, hasMessages]); // תלות רק ב-agent.id ו-hasMessages, לא במלוא ה-agent

  return {
    suggestedPrompts: data?.suggested_prompts || [],
    isLoading: isPending,
  };
};

