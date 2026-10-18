import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createAgent } from '../requests';
import type { CreateAgentPayload, CreateAgentResponse } from '../types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useCreateAgent = () => {
  const navigate = useNavigate();

  const mutation = useMutation<CreateAgentResponse, AxiosError<ErrorResponse>, CreateAgentPayload>({
    mutationFn: createAgent,
    onMutate: () => {
      // Navigate to loading page when mutation starts
      navigate('/agent-loading');
    },
    onSuccess: (data) => {
      console.log('✅ Agent created successfully:', data);
      // Store agent data in sessionStorage for the summary page
      sessionStorage.setItem('newAgentData', JSON.stringify(data));
      // Loading page will handle navigation to summary page after 2 seconds
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Failed to create agent';
      console.error('❌ Error creating agent:', message);
      toast.error(message);
      // Navigate back to builder on error
      navigate('/builder');
    },
  });

  const handleCreate = (payload: CreateAgentPayload) => {
    if (!payload.prompt.trim()) {
      return;
    }
    
    mutation.mutate(payload);
  };

  return {
    createAgent: mutation.mutate,
    createAgentAsync: mutation.mutateAsync,
    handleCreate,
    isCreating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
};

