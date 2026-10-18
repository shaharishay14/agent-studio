import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteFile as deleteFileRequest } from '../requests';
import useModalsStore from '../../../../../store/modals.store';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useDeleteFile = (agentId: string | undefined) => {
  const queryClient = useQueryClient();
  const { openDeleteFileModal, closeDeleteFileModal } = useModalsStore();

  const { mutate: deleteFile, isPending: isDeleting } = useMutation<void, AxiosError<ErrorResponse>, string | number>({
    mutationFn: async (fileId: string | number) => {
      await deleteFileRequest(fileId);
    },
    onSuccess: () => {
      console.log('✅ הקובץ נמחק בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['agent-files', agentId] });
      closeDeleteFileModal();
      toast.success('File deleted successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Error deleting file';
      console.error('❌ שגיאה במחיקת קובץ:', message);
      closeDeleteFileModal();
      toast.error(message);
    },
  });

  const handleDeleteFile = (fileId: string | number, fileName: string) => {
    openDeleteFileModal(fileId, fileName);
  };

  const confirmDelete = (fileId: string | number) => {
    deleteFile(fileId);
  };

  return {
    deleteFile,
    handleDeleteFile,
    confirmDelete,
    isDeleting,
  };
};

