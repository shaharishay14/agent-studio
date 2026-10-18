import { api } from '../../../../lib/axios';
import type { Agent, Message, SendMessagePayload, SendMessageResponse, UpdateAgentPayload, AgentFile, UploadFileResponse, SuggestedPromptsPayload, SuggestedPromptsResponse, AvailableToolsResponse, AvailableAgentToolsResponse, AddAgentToolPayload, AddAgentToolResponse, ConnectTelegramBotRequest, TelegramBotResponse } from '../types';

export const getAgent = async (id: string): Promise<Agent> => {
  const response = await api.get<Agent>(`/agents/${id}/`);
  return response.data;
};

export const getAgentMessages = async (id: string): Promise<Message[]> => {
  const response = await api.get<Message[]>(`/agents/${id}/messages/`);
  return response.data;
};

export const sendMessage = async (id: string, payload: SendMessagePayload): Promise<SendMessageResponse> => {
  const response = await api.post<SendMessageResponse>(`/agents/${id}/chat/`, payload);
  return response.data;
};

export const updateAgent = async (id: string, payload: UpdateAgentPayload): Promise<Agent> => {
  // יצירת FormData לתמיכה בהעלאת avatar
  const formData = new FormData();
  
  if (payload.name !== undefined) {
    formData.append('name', payload.name);
  }
  
  if (payload.prompt !== undefined) {
    formData.append('prompt', payload.prompt);
  }
  
  if (payload.app_connections !== undefined) {
    // המרת array ל-JSON string
    formData.append('app_connections', JSON.stringify(payload.app_connections));
  }
  
  if (payload.avatar) {
    formData.append('avatar', payload.avatar);
  }
  
  const response = await api.patch<Agent>(`/agents/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getFile = async (fileId: string): Promise<AgentFile> => {
  const response = await api.get<AgentFile>(`/files/${fileId}/`);
  return response.data;
};

export const getAgentFiles = async (id: string): Promise<AgentFile[]> => {
  const response = await api.get<AgentFile[]>('/files/', {
    params: {
      agent_id: id
    }
  });
  return response.data;
};

export const uploadFile = async (file: File, agentId: string): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('agent_id', agentId);
  const response = await api.post<UploadFileResponse>('/files/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteFile = async (fileId: string | number): Promise<void> => {
  await api.delete(`/files/${fileId}/`);
};

export const downloadFile = async (fileId: string | number, fileName: string): Promise<void> => {
  const response = await api.get(`/files/${fileId}/download/`, {
    responseType: 'blob',
  });
  
  // Create a blob URL
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const url = window.URL.createObjectURL(blob);
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const resetAgentMemory = async (agentId: string): Promise<void> => {
  await api.post(`/agents/${agentId}/reset-chat/`);
};

// First endpoint - available tools
export const getAvailableTools = async (id: string): Promise<AvailableToolsResponse> => {
  const response = await api.get<AvailableToolsResponse>(`/agents/${id}/available_tools/`);
  return response.data;
};

// Second endpoint - available agent tools
export const getAvailableAgentTools = async (id: string): Promise<AvailableAgentToolsResponse> => {
  const response = await api.get<AvailableAgentToolsResponse>(`/agents/${id}/available-agent-tools/`);
  return response.data;
};

export const getSuggestedPrompts = async (payload: SuggestedPromptsPayload): Promise<SuggestedPromptsResponse> => {
  const response = await api.post<SuggestedPromptsResponse>('/agents/suggested-prompts/', payload);
  return response.data;
};

export const addAgentTool = async (agentId: string, payload: AddAgentToolPayload): Promise<AddAgentToolResponse> => {
  const response = await api.post<AddAgentToolResponse>(`/agents/${agentId}/add-agent-tool/`, payload);
  return response.data;
};

export const removeAgentTool = async (agentId: string, toolName: string): Promise<void> => {
  await api.delete(`/agents/${agentId}/remove-agent-tool/${toolName}/`);
};

export const getTelegramBot = async (agentId: string): Promise<TelegramBotResponse[]> => {
  const response = await api.get<TelegramBotResponse[]>(`/agents/${agentId}/messaging/channels/`);
  return response.data;
};

export const connectTelegramBot = async (agentId: string, data: ConnectTelegramBotRequest): Promise<TelegramBotResponse> => {
  const response = await api.post<TelegramBotResponse>(`/agents/${agentId}/telegram/connect/`, data);
  return response.data;
};

export const disconnectTelegramBot = async (agentId: string): Promise<void> => {
  await api.post(`/agents/${agentId}/messaging/disconnect/`, {
    platform: 'telegram'
  });
};

