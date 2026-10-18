import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteConnection } from '../requests';
import type { Integration } from '../components/types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useDisconnectTool = (integrations: Integration[]) => {
  const queryClient = useQueryClient();
  const [disconnectingToolName, setDisconnectingToolName] = useState<string | null>(null);

  const mutation = useMutation<unknown, AxiosError<ErrorResponse>, number>({
    mutationFn: deleteConnection,
    onSuccess: (_, connectionId) => {
      console.log('✅ החיבור נותק בהצלחה:', connectionId);
      
      // רענון הנתונים
      queryClient.invalidateQueries({ queryKey: ['availableTools'] });
      
      toast.success('Connection disconnected successfully');
      setDisconnectingToolName(null);
    },
    onError: (error, connectionId) => {
      console.error('❌ שגיאה בניתוק החיבור:', connectionId);
      console.error('📄 פרטי השגיאה:', error.response?.data || error.message);
      
      toast.error('Error disconnecting. Please try again.');
      setDisconnectingToolName(null);
    },
  });

  const handleDisconnect = (id: string) => {
    // מציאת הכלי לפי ה-id
    const integration = integrations.find(i => i.id === id);
    if (!integration) {
      console.error('❌ לא נמצא כלי עם ID:', id);
      return;
    }
    
    if (!integration.connectionId) {
      console.error('❌ לא נמצא connection_id עבור הכלי:', integration.name);
      return;
    }
    
    console.log('🔌 מנתק כלי:', integration.name, 'Connection ID:', integration.connectionId);
    
    // שליחת בקשה לניתוק
    setDisconnectingToolName(integration.name);
    mutation.mutate(integration.connectionId);
  };

  return {
    disconnectTool: handleDisconnect,
    disconnectToolAsync: mutation.mutateAsync,
    isDisconnecting: mutation.isPending,
    disconnectingToolName,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
};

