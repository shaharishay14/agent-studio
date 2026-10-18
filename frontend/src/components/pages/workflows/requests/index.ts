import { api } from '../../../../lib/axios';
import type { 
  CreateWorkflowRequest, 
  CreateWorkflowResponse, 
  UpdateWorkflowRequest,
  UpdateWorkflowResponse,
  Workflow,
  CreateAgentInWorkflowRequest,
  CreateAgentInWorkflowResponse,
  ExecuteWorkflowRequest,
  ExecuteWorkflowResponse
} from '../types';

export const createWorkflow = async (data: CreateWorkflowRequest): Promise<CreateWorkflowResponse> => {
  console.log('Creating workflow:', data);
  const response = await api.post<CreateWorkflowResponse>('/workflows/', data);
  return response.data;
};

export const getWorkflows = async (): Promise<Workflow[]> => {
  const response = await api.get<Workflow[]>('/workflows/');
  return response.data;
};

export const updateWorkflow = async (id: number, data: UpdateWorkflowRequest): Promise<UpdateWorkflowResponse> => {
  // ודא ש-agents הם רק IDs (strings), לא אובייקטים
  const processedData = {
    ...data,
    agents: data.agents 
      ? data.agents.map((agent: any) => {
          // אם זה אובייקט, קח את ה-ID
          if (typeof agent === 'object' && agent !== null && 'id' in agent) {
            return agent.id;
          }
          // אם זה כבר string (ID), החזר אותו
          return agent;
        }).filter((id: any): id is string => typeof id === 'string')
      : undefined
  };
  
  const response = await api.patch<UpdateWorkflowResponse>(`/workflows/${id}/`, processedData);
  return response.data;
};

export const deleteWorkflow = async (id: number): Promise<void> => {
  await api.delete(`/workflows/${id}/`);
};

export const createAgentInWorkflow = async (
  id: number, 
  data: CreateAgentInWorkflowRequest
): Promise<CreateAgentInWorkflowResponse> => {
  const response = await api.post<CreateAgentInWorkflowResponse>(
    `/workflows/${id}/create-agent/`, 
    data
  );
  return response.data;
};

export const executeWorkflow = async (
  id: number,
  data: ExecuteWorkflowRequest
): Promise<ExecuteWorkflowResponse> => {
  const response = await api.post<ExecuteWorkflowResponse>(`/workflows/${id}/execute/`, data);
  return response.data;
};

