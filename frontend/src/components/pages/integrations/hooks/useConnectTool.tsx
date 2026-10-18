import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { connectTool } from '../requests';
import type { Integration } from '../components/types';
import type { AxiosError } from 'axios';

interface ConnectToolPayload {
  tool_name: string;
  redirect_url?: string;
}

interface ErrorResponse {
  message: string;
}

interface ConnectToolResponse {
  auth_url?: string;
  connection?: {
    id: number;
    user: string;
    tool_name: string;
    auth_config_id: string;
    connected_at: string;
  };
  success: boolean;
}

export const useConnectTool = (integrations: Integration[], onRefetch?: () => void) => {
  const [connectingToolName, setConnectingToolName] = useState<string | null>(null);
  const location = useLocation();
  const queryClient = useQueryClient();
  const popupWindowRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  const mutation = useMutation<ConnectToolResponse, AxiosError<ErrorResponse>, ConnectToolPayload>({
    mutationFn: connectTool,
    onSuccess: (data) => {      


      if (data.auth_url) {
        const popup = window.open(data.auth_url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        popupWindowRef.current = popup;
        
        // התחלת polling לבדיקה אם ה-URL השתנה ל-integrations
        if (popup && onRefetch) {
          pollingIntervalRef.current = window.setInterval(() => {
            try {
              // בדיקה אם ה-pathname השתנה
              const popupPathname = popup.location.pathname;
              
              // בדיקה אם ה-pathname מכיל '/chat/' עם agent ID או '/integrations'
              const isChatPath = /\/chat\/([^\/\?]+)/.test(popupPathname);
              const isIntegrationsPath = popupPathname.includes('/integrations');
              
              if (isChatPath || isIntegrationsPath) {
                // ה-pathname השתנה - סגירת החלון ו-refetch
                popup.close();
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                popupWindowRef.current = null;
                toast.success('Connection successful!');
                onRefetch();
                
                // אם ה-pathname מכיל 'chat', נחלץ את ה-agent ID ונעשה refetch
                if (isChatPath) {
                  // חילוץ agent ID מה-pathname - מחפש /chat/:agentid
                  const chatMatch = popupPathname.match(/\/chat\/([^\/\?]+)/);
                  if (chatMatch && chatMatch[1]) {
                    const agentId = chatMatch[1];
                    queryClient.invalidateQueries({ queryKey: ['combinedAvailableTools', agentId] });
                  } else {
                    // אם לא מצאנו agent ID ספציפי, נעדכן את כל ה-queries
                    queryClient.invalidateQueries({ queryKey: ['combinedAvailableTools'] });
                  }
                }
              }
            } catch (e) {
              // שגיאה בגישה ל-URL (cross-origin) - זה תקין, פשוט נמשיך לבדוק
              // זה קורה כשהחלון עדיין על דומיין אחר
            }
          }, 500); // בדיקה כל 500ms
        }
      }
      
      setConnectingToolName(null);
    },
    onError: (error, variables) => {
      console.error('❌ שגיאה בחיבור הכלי:', variables.tool_name);
      console.error('📄 פרטי השגיאה:', error.response?.data || error.message);
      
      // הצגת הודעת שגיאה ב-toast
      toast.error('Connection error. If this issue persists, please contact support.');
      
      setConnectingToolName(null);
    },
  });

  // ניקוי polling כאשר הקומפוננטה נסגרת
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const handleConnect = (id: string) => {
    // מציאת שם הכלי לפי ה-id
    const integration = integrations.find(i => i.id === id);
    if (!integration) {
      console.error('❌ לא נמצא כלי עם ID:', id);
      return;
    }    

    // שליחת בקשה לחיבור עם redirect_url
    setConnectingToolName(integration.name);
    mutation.mutate({ 
      tool_name: integration.name,
      redirect_url: location.pathname
    });
  };

  return {
    connectTool: handleConnect,
    connectToolAsync: mutation.mutateAsync,
    isConnecting: mutation.isPending,
    connectingToolName,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
};

