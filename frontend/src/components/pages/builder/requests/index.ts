import { api } from '../../../../lib/axios';
import type { CreateAgentPayload, CreateAgentResponse } from '../types';

export const createAgent = async (payload: CreateAgentPayload): Promise<CreateAgentResponse> => {
  const formData = new FormData();
  
  // prompt is required
  formData.append('prompt', payload.prompt);
  
  // Optional fields
  if (payload.template_id) {
    formData.append('template_id', payload.template_id);
  }
  
  if (payload.name) {
    formData.append('name', payload.name);
  }
  
  if (payload.avatar) {
    formData.append('avatar', payload.avatar);
  }
  
  // Arrays - append as JSON strings or individual items based on server expectation
  if (payload.app_connections && payload.app_connections.length > 0) {
    formData.append('app_connections', JSON.stringify(payload.app_connections));
  }
  
  if (payload.agent_tools && payload.agent_tools.length > 0) {
    formData.append('agent_tools', JSON.stringify(payload.agent_tools));
  }
  
  // Multiple files
  if (payload.files && payload.files.length > 0) {
    payload.files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const response = await api.post<CreateAgentResponse>('/agents/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getTemplates = async (): Promise<any> => {
  try {
    const response = await api.get('/agents/templates/');
    // וידוא שהתשובה היא array, אחרת נחזיר array ריק
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
};

