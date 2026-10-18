import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Message } from '../types';

// פונקציה לקריאת cookie
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

interface StatusData {
  status: string;
  message: string;
  timestamp: string;
}

interface ToolCallStartData {
  tool: string;
  parameters: any;
  timestamp: string;
}

interface ToolCallResultData {
  tool: string;
  success: boolean;
  result?: any;
  error?: string;
  timestamp: string;
}

interface ContentDeltaData {
  content: string;
  index: number;
  timestamp: string;
}

interface MessageCompleteData {
  message_id: number;
  content: string;
  created_at: string;
}

export const useSendMessageStream = (agentId: string) => {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState('');
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // מחרוזת את התוכן הנוכחי מה-stream
  const streamingContentRef = useRef('');
  
  // Queue של chunks להצגה
  const chunksQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]); // שמירת כל ה-timeouts

  // פונקציה להצגה הדרגתית של chunks
  const processNextChunk = useCallback(() => {
    if (chunksQueueRef.current.length === 0) {
      isProcessingRef.current = false;
      return;
    }

    const chunk = chunksQueueRef.current.shift()!;
    const words = chunk.split(' ');
    
    let wordIndex = 0;
    const displayWords = () => {
      if (wordIndex < words.length) {
        streamingContentRef.current += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        setCurrentStreamingContent(streamingContentRef.current);
        console.log('🖊️ מציג מילה:', words[wordIndex]);
        wordIndex++;
        const timeoutId = window.setTimeout(displayWords, 50); // 50ms במקום 300ms
        timeoutIdsRef.current.push(timeoutId);
      } else {
        processNextChunk(); // עבור ל-chunk הבא
      }
    };
    
    displayWords();
  }, []);

  // פונקציה להוספת chunk לתור
  const addChunkToQueue = useCallback((chunk: string) => {
    chunksQueueRef.current.push(chunk);
    
    if (!isProcessingRef.current) {
      isProcessingRef.current = true;
      processNextChunk();
    }
  }, [processNextChunk]);

  // פונקציה לניקוי מלא של ה-streaming
  const clearStreaming = useCallback(() => {
    // ביטול כל ה-timeouts
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
    
    // ניקוי ה-queue
    chunksQueueRef.current = [];
    isProcessingRef.current = false;
    
    // ניקוי ה-state
    setIsStreamingResponse(false);
    setCurrentStreamingContent('');
    streamingContentRef.current = '';
  }, []);

  const handleSendMessage = useCallback(async (message: string, files: File[] = []) => {
    if (!message.trim() || isSending) {
      return;
    }

    // הוספת הודעת המשתמש מיד ל-UI
    const userMessage: Message = {
      id: Date.now(), // temporary ID
      agent: agentId,
      role: 'user',
      content: message.trim(),
      attachments: '',
      created_at: new Date().toISOString(),
    };

    queryClient.setQueryData<Message[]>(['agent-messages', agentId], (oldMessages = []) => {
      return [...oldMessages, userMessage];
    });

    setIsSending(true);
    setIsStreamingResponse(true);
    setStatus('');
    streamingContentRef.current = '';
    setCurrentStreamingContent('');
    chunksQueueRef.current = [];
    isProcessingRef.current = false;
    timeoutIdsRef.current = [];

    // יצירת AbortController חדש
    abortControllerRef.current = new AbortController();

    try {
      const baseURL = import.meta.env.VITE_API_URL || '';
      const url = `${baseURL}/api/agents/${agentId}/chat/`;
      
      // בניית FormData עם ההודעה והקבצים
      const formData = new FormData();
      formData.append('message', message.trim());
      
      // הוספת קבצים ל-FormData
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      // בניית headers עם CSRF token אם קיים
      // שים לב: לא מוסיפים Content-Type כי הדפדפן ימלא אותו אוטומטית עם multipart/form-data
      const headers: Record<string, string> = {
        'Accept': '*/*', // קבלת כל סוג תוכן
      };
      
      // הוספת CSRF token אם קיים
      const csrfToken = getCookie('csrftoken');
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      await fetchEventSource(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
        signal: abortControllerRef.current.signal,
        
        async onopen(response) {
          
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            return;
          } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            // שגיאת client - לא צריך retry
            try {
              const contentType = response.headers.get('content-type');
              let errorMessage = `Error: ${response.status}`;
              
              if (contentType?.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
                console.error('❌ Server Error:', errorData);
              } else {
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
                console.error('❌ Server Error (text):', errorText);
              }
              
              throw new Error(errorMessage);
            } catch (e) {
              if (e instanceof Error) {
                throw e;
              }
              throw new Error(`Error: ${response.status}`);
            }
          } else {
            // שגיאת server או network - ה-library ינסה שוב
            throw new Error(`Server error: ${response.status}`);
          }
        },

        onmessage(event) {
          const eventType = event.event || 'message';
          let data: any;

          try {
            data = JSON.parse(event.data);
          } catch (e) {
            data = event.data;
          }

          switch (eventType) {
            case 'status':
              const statusData = data as StatusData;
              setStatus(statusData.message);
              break;

            case 'tool_call_start':
              const toolStartData = data as ToolCallStartData;
              setStatus(`Running ${toolStartData.tool}...`);
              break;

            case 'tool_call_result':
              const toolResultData = data as ToolCallResultData;
              if (toolResultData.success) {
                setStatus(`${toolResultData.tool} completed successfully`);
              } else {
                setStatus(`Error running ${toolResultData.tool}`);
              }
              break;

            case 'content_delta':
              const contentData = data as ContentDeltaData;
              addChunkToQueue(contentData.content);
              break;

            case 'message_complete':
              const completeData = data as MessageCompleteData;
              
              // ניקוי מיידי של כל ה-streaming
              clearStreaming();
              
              // הוספת ההודעה המושלמת ל-cache
              const assistantMessage: Message = {
                id: completeData.message_id,
                agent: agentId,
                role: 'assistant',
                content: completeData.content,
                attachments: '',
                created_at: completeData.created_at,
              };
              
              queryClient.setQueryData<Message[]>(['agent-messages', agentId], (oldMessages = []) => {
                return [...oldMessages, assistantMessage];
              });
              
              // עדכון מספר ההודעות של האייג'נט
              queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
              break;

            case 'done':
              
              setStatus('');
              setIsSending(false);
              
              // ניקוי סופי
              clearStreaming();
              break;

            case 'error':
              const errorData = data as { error: string; details?: string };
              console.error('❌ שגיאה מהשרת:', errorData.error);
              toast.error(errorData.error);
              throw new Error(errorData.error);

            case 'heartbeat':
              // סתם keep-alive, לא צריך לעשות כלום
              break;
          }
        },

        onerror(error) {
          console.error('❌ שגיאת Stream:', error);

          // ניקוי מלא
          clearStreaming();

          setIsSending(false);
          setStatus('');
          
          // אם השגיאה היא abort, לא להציג toast
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Error sending message';
          toast.error(errorMessage);
          
          // עצירת ה-retry
          throw error;
        },

        openWhenHidden: true, // לשמור על החיבור גם כשהטאב לא פעיל
      });

      // ניקוי השדה אחרי שליחה מוצלחת
      setMessageText('');

    } catch (error) {
      console.error('❌ שגיאה כללית:', error);
      
      // ניקוי מלא
      clearStreaming();
      
      // ודא שה-state מתנקה
      setIsSending(false);
      setStatus('');
    }
  }, [agentId, queryClient, isSending, clearStreaming, addChunkToQueue]);

  // פונקציה לשליחת הודעה מהשדה
  const onSendMessage = useCallback(() => {
    if (!messageText.trim() || isSending) return;
    handleSendMessage(messageText);
  }, [messageText, isSending, handleSendMessage]);

  // טיפול ב-Enter
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  }, [onSendMessage]);

  // פונקציה לביטול שליחה
  const cancelSending = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // ניקוי מלא
    clearStreaming();
    
    // ניקוי state
    setIsSending(false);
    setStatus('');
  }, [clearStreaming]);

  return {
    // State
    messageText,
    setMessageText,
    isSending,
    status,
    currentStreamingContent,
    isStreamingResponse,
    
    // Functions
    handleSendMessage,
    onSendMessage,
    handleKeyPress,
    cancelSending,
  };
};

