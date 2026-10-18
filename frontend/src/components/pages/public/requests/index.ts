import { api } from '../../../../lib/axios';
import type { Agent } from '../../chat/types';

export const getPublicAgent = async (id: string): Promise<Agent> => {
  const response = await api.get<Agent>(`/agents/public/${id}/`);
  return response.data;
};

