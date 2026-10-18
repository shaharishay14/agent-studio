import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadFile } from '../requests';
import type { UploadFileResponse } from '../types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

export const useUploadFiles = (agentId: string | undefined) => {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { mutate: uploadFiles, isPending: isUploading } = useMutation<UploadFileResponse[], AxiosError<ErrorResponse>, File[]>({
    mutationFn: async (files: File[]) => {
      if (!agentId) {
        throw new Error('Agent ID is required');
      }
      const uploadPromises = files.map(file => uploadFile(file, agentId));
      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      console.log('✅ הקבצים הועלו בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['agent-files', agentId] });
      setSelectedFiles([]);
      toast.success('Files uploaded successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Error uploading files';
      console.error('❌ שגיאה בהעלאת קבצים:', message);
      toast.error(message);
    },
  });

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUploadFiles = () => {
    if (selectedFiles.length > 0) {
      uploadFiles(selectedFiles);
    }
  };

  return {
    selectedFiles,
    setSelectedFiles,
    handleFileSelect,
    handleUploadFiles,
    uploadFiles,
    isUploading,
  };
};

