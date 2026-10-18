import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { updateWorkflow } from '../requests';
import type { UpdateWorkflowRequest, UpdateWorkflowResponse } from '../types';

interface ErrorResponse {
  agents?: {
    error?: string;
    message?: string;
  };
  message?: string;
}

export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UpdateWorkflowResponse, AxiosError<ErrorResponse>, { id: number; data: UpdateWorkflowRequest }>({
    mutationFn: ({ id, data }) => updateWorkflow(id, data),
    onSuccess: () => {
      toast.success('Workflow updated successfully!');
      // Invalidate and refetch workflows
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: (error) => {
      // בדוק אם זו שגיאת duplicate_agent
      const errorData = error.response?.data;
      if (errorData?.agents?.error === 'duplicate_agent') {
        toast.error('Cannot add duplicate agent', {
          description: 'You cannot add the same agent twice to the workflow.',
        });
      } else {
        const message = errorData?.message || error.message || 'error updating workflow';
        toast.error(message);
      }
      console.error('Error updating workflow:', error);
    },
  });
};

