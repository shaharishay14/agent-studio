import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateAgent } from '../requests';
import type { UpdateAgentPayload, Agent } from '../types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useUpdateAgent = (agentId: string, agent?: Agent) => {
  const queryClient = useQueryClient();
  const [agentName, setAgentName] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // עדכון ה-state כשה-agent משתנה
  useEffect(() => {
    if (agent) {
      setAgentName(agent.name || '');
      setAgentPrompt(agent.prompt || '');
    }
  }, [agent]);

  const { mutate, mutateAsync, isPending, isSuccess, isError, error, data, reset } = useMutation<Agent, AxiosError<ErrorResponse>, UpdateAgentPayload>({
    mutationFn: (payload) => updateAgent(agentId, payload),
    onSuccess: (data, variables) => {
      console.log('✅ האייג\'נט עודכן בהצלחה:', data);
      
      // עדכון נתוני האייג'נט בקאש
      queryClient.setQueryData<Agent>(['agent', agentId], data);
      
      // עדכון רשימת האייג'נטים
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      
      // אם ה-payload מכיל app_connections, עדכן את רשימת הכלים הזמינים
      if (variables.app_connections !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['combinedAvailableTools', agentId] });
      }
      
      toast.success('Changes saved successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Error saving changes';
      console.error('❌ שגיאה בעדכון agent:', message);
      toast.error(message);
    },
  });

  const handleAvatarSelect = (file: File | null) => {
    if (!file) {
      setSelectedAvatar(null);
      setPreviewUrl(null);
      return;
    }

    // בדיקת סוג הקובץ
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPEG or PNG files can be uploaded');
      return;
    }

    // בדיקת גודל (מקסימום 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

    setSelectedAvatar(file);
    
    // יצירת URL לתצוגה מקדימה
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = () => {
    if (!agent?.id) return;

    const payload: UpdateAgentPayload = {};
    
    if (agentName !== agent.name) {
      payload.name = agentName;
    }
    
    if (agentPrompt !== agent.prompt) {
      payload.prompt = agentPrompt;
    }

    if (selectedAvatar) {
      payload.avatar = selectedAvatar;
    }

    // שולח רק אם יש שינויים
    if (Object.keys(payload).length > 0) {
      mutate(payload);
      // נקה את ה-avatar אחרי שליחה מוצלחת
      if (selectedAvatar) {
        setSelectedAvatar(null);
        setPreviewUrl(null);
      }
    }
  };

  return {
    updateAgent: mutate,
    updateAgentAsync: mutateAsync,
    isUpdating: isPending,
    isSuccess,
    isError,
    error,
    data,
    reset,
    agentName,
    setAgentName,
    agentPrompt,
    setAgentPrompt,
    handleSaveSettings,
    selectedAvatar,
    previewUrl,
    handleAvatarSelect,
  };
};

