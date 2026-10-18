export interface Agent {
  id: string;
  user: string;
  name: string;
  prompt: string;
  tools: string[];
  app_connections: string[];
  agent_tools: string[];
  created_at: string;
  updated_at: string;
  message_count: number;
  avatar_base64?: string;
}

export interface CreateManualAgentPayload {
  name: string;
  prompt: string;
  avatar?: File | null;
  app_connections?: string[];
  agent_tools?: string[];
  files?: File[];
}

