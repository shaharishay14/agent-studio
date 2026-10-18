import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getSuggestedPrompts } from '../requests';
import type { SuggestedPromptsPayload, SuggestedPromptsResponse } from '../types';
import type { AxiosError } from 'axios';
import type { Agent, Message } from '../types';

interface ErrorResponse {
  message: string;
}

export const useGetSuggestedPrompts = (messages: Message[], agent?: Agent) => {
  const { mutate, mutateAsync, isPending, isSuccess, isError, error, data, reset } = useMutation<
    SuggestedPromptsResponse,
    AxiosError<ErrorResponse>,
    SuggestedPromptsPayload
  >({
    mutationFn: (payload) => getSuggestedPrompts(payload),
    onSuccess: () => {},
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Error getting suggested prompts';
      toast.error(message);
    },
  });

  // שמירת ההודעה האחרונה שבה ביקשנו הצעות
  const lastProcessedMessageId = useRef<string | null>(null);
  // שמירה אם כבר ביקשנו הצעות ראשוניות
  const hasRequestedInitialSuggestions = useRef(false);
  // שמירת ה-agent הקודם כדי לזהות שינויים
  const previousAgentId = useRef<string | null>(null);

  // איפוס כשעוברים לאייג'נט אחר
  useEffect(() => {
    if (agent?.id && previousAgentId.current !== agent.id) {
      hasRequestedInitialSuggestions.current = false;
      lastProcessedMessageId.current = null;
      previousAgentId.current = agent.id;
    }
  }, [agent?.id]);

  // כאשר משתמש שולח הודעה, נבקש הצעות לפרומפט הבא
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!agent || isPending) {
        return;
      }

      // בדוק אם יש הודעות מהמשתמש
      const hasUserMessages = messages.some(msg => msg.role === 'user');
      
      // אם אין הודעות מהמשתמש, נבקש הצעות ראשוניות (רק פעם אחת)
      if (!hasUserMessages) {
        if (!hasRequestedInitialSuggestions.current) {
          try {
            // המרת app_connections מ-string ל-array
            let appConnections: string[] = [];
            if (agent.app_connections) {
              try {
                if (Array.isArray(agent.app_connections)) {
                  appConnections = agent.app_connections;
                } else if (typeof agent.app_connections === 'string') {
                  appConnections = JSON.parse(agent.app_connections);
                }
              } catch {
                appConnections = [];
              }
            }
            
            // קריאה להצעות ראשוניות על בסיס ה-prompt של האייג'נט
            await mutateAsync({
              prompt: agent.prompt || 'Hello, how can I help you?',
              app_connections: appConnections
            });
            
            hasRequestedInitialSuggestions.current = true;
          } catch (error) {
            // שגיאה מטופלת ב-onError של ה-mutation
          }
        }
        return;
      }

      // אם יש הודעות מהמשתמש, נבקש הצעות על בסיס ההודעה האחרונה מהמשתמש
      if (hasUserMessages && messages.length > 0) {
        // מצא את ההודעה האחרונה מהמשתמש
        const lastUserMessage = [...messages]
          .reverse()
          .find(msg => msg.role === 'user');
        
        // בדוק שיש הודעה מהמשתמש והיא לא ריקה
        if (lastUserMessage && lastUserMessage.content && lastUserMessage.content.trim()) {
          // בדוק אם כבר ביקשנו הצעות עבור ההודעה הזו
          const messageId = String(lastUserMessage.id || lastUserMessage.content);
          if (lastProcessedMessageId.current === messageId) {
            return; // כבר ביקשנו הצעות עבור ההודעה הזו
          }

          try {
            // המרת app_connections מ-string ל-array
            let appConnections: string[] = [];
            if (agent.app_connections) {
              try {
                // אם זה כבר array, השתמש בו, אחרת parse
                if (Array.isArray(agent.app_connections)) {
                  appConnections = agent.app_connections;
                } else if (typeof agent.app_connections === 'string') {
                  appConnections = JSON.parse(agent.app_connections);
                }
              } catch {
                appConnections = [];
              }
            }
            
            // קריאה להצעות פרומפטים
            await mutateAsync({
              prompt: lastUserMessage.content.trim(),
              app_connections: appConnections
            });
            
            // שמירת ההודעה שבה ביקשנו הצעות
            lastProcessedMessageId.current = messageId;
          } catch (error) {
            // שגיאה מטופלת ב-onError של ה-mutation
          }
        }
      }
    };
    
    fetchSuggestions();
  }, [messages, agent, mutateAsync, isPending]);

  return {
    // Functions
    getSuggestedPrompts: mutate,
    getSuggestedPromptsAsync: mutateAsync,
    
    // Status
    isLoading: isPending,
    isSuccess,
    isError,
    error,
    suggestedPrompts: data?.suggested_prompts || [],
    reset,
  };
};

