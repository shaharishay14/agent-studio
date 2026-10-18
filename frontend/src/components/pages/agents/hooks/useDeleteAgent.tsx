import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteAgent } from '../requests';
import useModalsStore from '../../../../../store/modals.store';
import type { AxiosError } from 'axios';
import type { Agent } from '../types';

interface ErrorResponse {
  message: string;
}

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();
  const { openDeleteModal, closeDeleteModal, deleteModal } = useModalsStore();

  const { mutate, isPending, isSuccess, isError, error } = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: deleteAgent,
    onSuccess: () => {
      toast.success('Agent deleted successfully!');
      // רענון רשימת ה-agents
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      closeDeleteModal();
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Error deleting agent';
      console.error('❌ שגיאה במחיקת agent:', message);
      toast.error(message);
    },
  });

  const handleDeleteClick = (agents: Agent[] | undefined, id: string) => {
    const agent = agents?.find(a => a.id === id);
    if (agent) {
      openDeleteModal(agent.id, agent.name);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteModal.agentId) {
      mutate(deleteModal.agentId);
    }
  };

  const handleCancelDelete = () => {
    closeDeleteModal();
  };

  return {
    deleteAgent: mutate,
    isDeleting: isPending,
    isSuccess,
    isError,
    error,
    deleteModal,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  };
};

