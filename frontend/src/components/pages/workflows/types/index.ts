import type { Agent } from "../../agents/types";

export interface Workflow {
  id: number;
  user: string;
  agents: Agent[];
  name: string;
  description: string;
  status: 'draft' | 'active' | 'inactive';
  nodes: string;
  edges: string;
  viewport: string;
  execution_count: number;
  last_executed: string;
  node_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description: string;
  status: 'draft' | 'active' | 'inactive';
  nodes?: string;
}

export interface CreateWorkflowResponse {
  id: number;
  user: string;
  agents: string[];
  name: string;
  description: string;
  status: 'draft' | 'active' | 'inactive';
  nodes: string;
  execution_count: number;
  last_executed: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateWorkflowRequest {
  agents?: string[];
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'inactive';
  nodes?: string;
}

export interface UpdateWorkflowResponse {
  id: number;
  user: string;
  agents: string[];
  name: string;
  description: string;
  status: 'draft' | 'active' | 'inactive';
  nodes: string;
  execution_count: number;
  last_executed: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentInWorkflowRequest {
  prompt: string;
}

export interface CreateAgentInWorkflowResponse extends Workflow {}

export interface ExecuteWorkflowRequest {
  prompt: string;
  agent_id: string;
}

export interface ExecuteWorkflowResponse {
  success: boolean;
  agent: Agent;
  message: string;
}

