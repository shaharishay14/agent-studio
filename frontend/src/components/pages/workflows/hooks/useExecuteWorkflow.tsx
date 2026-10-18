import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { executeWorkflow } from '../requests';
import type { ExecuteWorkflowResponse } from '../types';

interface ErrorResponse {
  message?: string;
}

export const useExecuteWorkflow = () => {
  return useMutation<
    ExecuteWorkflowResponse,
    AxiosError<ErrorResponse>,
    { workflowId: number; prompt: string; agentIds: string[] }
  >({
    mutationFn: async ({ workflowId, prompt, agentIds }) => {
      // שליחה סדרתית לכל agent
      let currentPrompt = prompt;
      let lastResponse: ExecuteWorkflowResponse | null = null;

      for (const agentId of agentIds) {
        try {
          const response = await executeWorkflow(workflowId, {
            prompt: currentPrompt,
            agent_id: agentId,
          });
          lastResponse = response;
          // אם התגובה מכילה message חדש, השתמש בו לשליחה הבאה
          if (response?.message) {
            currentPrompt = response.message;
          }
        } catch (error) {
          // אם יש שגיאה, עצור את הלולאה
          throw error;
        }
      }

      return lastResponse || { success: false, agent: {} as any, message: '' };
    },
    onSuccess: () => {
      toast.success('Workflow בוצע בהצלחה!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'שגיאה בביצוע workflow';
      toast.error(message);
      console.error('Error executing workflow:', error);
    },
  });
};

