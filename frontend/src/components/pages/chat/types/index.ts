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
  avatar_base64: string | null;
}

export interface Message {
  id: number;
  agent: string;
  role: 'user' | 'assistant';
  content: string;
  attachments: string;
  created_at: string;
}

export interface SendMessagePayload {
  message: string;
  file_ids: number[];
}

export interface SendMessageResponse {
  user_message: Message;
  assistant_message: Message;
}

export interface UpdateAgentPayload {
  name?: string;
  prompt?: string;
  app_connections?: string[];
  avatar?: File;
}

export interface AgentFile {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  download_url: string;
}

export interface UploadFileResponse {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  download_url: string;
}

export interface SuggestedPromptsPayload {
  prompt: string;
  app_connections: string[];
}

export interface SuggestedPromptsResponse {
  suggested_prompts: string[];
}

// Types for Available Tools (first endpoint)
export interface AvailableTool {
  tool_name: string;
  name: string;
  description: string;
  category: string;
  is_connected_to_account: boolean;
  is_connected_to_agent: boolean;
  connection_id: number | null;
}

export interface AvailableToolsResponse {
  tools: AvailableTool[];
  count: number;
}

// Types for Available Agent Tools (second endpoint)
export interface AvailableAgentTool {
  tool_name: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  is_enabled: boolean;
}

export interface AvailableAgentToolsResponse {
  tools: AvailableAgentTool[];
  count: number;
}

// Unified Tool Type
export interface UnifiedTool {
  tool_name: string;
  name: string;
  description: string;
  category: string;
  is_connected_to_account: boolean;
  is_connected_to_agent: boolean;
  connection_id: number | null;
  icon: string;
  isToolRequirePremission: boolean;
}

// Add Agent Tool Types
export interface AddAgentToolPayload {
  tool_name: string;
}

export interface AddAgentToolResponse {
  success: boolean;
  message: string;
  agent_tools: string[];
}

// Telegram Bot Types
export interface ConnectTelegramBotRequest {
  bot_token: string;
}

export interface TelegramBotResponse {
  id: number;
  platform: string;
  platform_display: string;
  bot_username: string;
  status: string;
  status_display: string;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export * from './triggers';

