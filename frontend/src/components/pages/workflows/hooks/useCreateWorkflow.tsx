import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createWorkflow } from '../requests';
import type { CreateWorkflowRequest, CreateWorkflowResponse } from '../types';

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  
  return useMutation<CreateWorkflowResponse, Error, CreateWorkflowRequest>({
    mutationFn: createWorkflow,
    onSuccess: (data) => {
      toast.success('Workflow נוצר בהצלחה!');
      console.log('Workflow created:', data);
      // Invalidate and refetch workflows
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: (error) => {
      toast.error('Error creating workflow');
      console.error('Error creating workflow:', error);
    },
  });
};

