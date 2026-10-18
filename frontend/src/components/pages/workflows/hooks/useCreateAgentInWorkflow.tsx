import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { createAgentInWorkflow } from '../requests';
import type { CreateAgentInWorkflowRequest, CreateAgentInWorkflowResponse } from '../types';

interface ErrorResponse {
  message?: string;
}

export const useCreateAgentInWorkflow = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CreateAgentInWorkflowResponse, 
    AxiosError<ErrorResponse>, 
    { id: number; data: CreateAgentInWorkflowRequest }
  >({
    mutationFn: ({ id, data }) => createAgentInWorkflow(id, data),
    onSuccess: () => {
      toast.success('Agent נוצר בהצלחה והוצמד ל-workflow!');
      // Invalidate and refetch workflows
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'שגיאה ביצירת agent';
      toast.error(message);
      console.error('Error creating agent in workflow:', error);
    },
  });
};

