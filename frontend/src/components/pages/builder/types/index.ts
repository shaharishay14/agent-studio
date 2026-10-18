export interface CreateAgentPayload {
  prompt: string;
  template_id?: string; // UUID of agent template to instantiate (Template Mode)
  name?: string; // Agent name (required for Manual Mode, auto-generated for YOLO Mode, optional override for Template Mode)
  avatar?: File | null; // Avatar image file (JPG or PNG, max 5MB)
  app_connections?: string[]; // List of app connection slugs (e.g., ['GMAIL', 'SLACK'])
  agent_tools?: string[]; // List of agent tool names (e.g., ['weather', 'calculator'])
  files?: File[]; // List of files to attach to this agent
}

export interface Agent {
  id: string;
  user: string;
  name: string;
  prompt: string;
  tools: string;
  app_connections: string[];
  agent_tools: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  avatar_base64: string | null;
}

export interface CreateAgentResponse extends Agent {
  message: string;
  missing_connections: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

// Templates types from server
export interface ServerTemplate {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  icon: string;
  category: string;
  default_tools: string[];
  default_agent_tools: string[];
  usage_count: number;
  created_at: string;
}

export interface ServerTemplateCategory {
  category_display_name: string;
  category_icon: string;
  templates: ServerTemplate[];
}

