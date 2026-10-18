import { api } from '../../../../lib/axios';
import type { AvailableToolsResponse, ToolCapabilitiesResponse } from '../types';

export const fetchAvailableTools = async (): Promise<AvailableToolsResponse> => {
  const response = await api.get<AvailableToolsResponse>('/connections/available_tools/');
  return response.data;
};

interface ConnectToolPayload {
  tool_name: string;
  redirect_url?: string;
}

export const connectTool = async (payload: ConnectToolPayload) => {
  const response = await api.post('/connections/', payload);
  return response.data;
};

export const fetchConnections = async () => {
  const response = await api.get('/connections/check_connections/');
  return response.data;
};

export const deleteConnection = async (id: number) => {
  const response = await api.delete(`/connections/${id}/`);
  return response.data;
};

export const fetchToolCapabilities = async (toolName: string): Promise<ToolCapabilitiesResponse> => {
  const response = await api.get<ToolCapabilitiesResponse>('/connections/tool_slugs/', {
    params: {
      tool_name: toolName
    }
  });
  return response.data;
};

export const fetchConnectionsForDisplay = async () => {
  const response = await api.get('/connections/connections_for_display/');
  return response.data;
};
