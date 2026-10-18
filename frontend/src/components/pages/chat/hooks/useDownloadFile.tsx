import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { downloadFile as downloadFileRequest } from '../requests';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

interface DownloadFileParams {
  fileId: string | number;
  fileName: string;
}

export const useDownloadFile = () => {
  const { mutate: downloadFile, isPending: isDownloading } = useMutation<void, AxiosError<ErrorResponse>, DownloadFileParams>({
    mutationFn: async ({ fileId, fileName }: DownloadFileParams) => {
      await downloadFileRequest(fileId, fileName);
    },
    onSuccess: () => {
      console.log('✅ הקובץ הורד בהצלחה');
      toast.success('File downloaded successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Error downloading file';
      console.error('❌ שגיאה בהורדת קובץ:', message);
      toast.error(message);
    },
  });

  const handleDownloadFile = (fileId: string | number, fileName: string) => {
    downloadFile({ fileId, fileName });
  };

  return {
    downloadFile,
    handleDownloadFile,
    isDownloading,
  };
};

