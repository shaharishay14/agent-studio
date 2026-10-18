import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteWorkflow } from '../requests';

export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, number>({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      toast.success('Workflow נמחק בהצלחה!');
      // Invalidate and refetch workflows
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: (error) => {
      toast.error('Error deleting workflow');
      console.error('Error deleting workflow:', error);
    },
  });
};

