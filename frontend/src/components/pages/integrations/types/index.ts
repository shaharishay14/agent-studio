export interface AvailableTool {
  name: string;
  description: string;
  category: string;
  is_active?: boolean;
  tool_name?: string;
  slug?: string;
  connection_id?: number;
}

export interface AvailableToolsResponse {
  tools: AvailableTool[];
  count: number;
}

export interface ToolCapabilitiesResponse {
  tool_name: string;
  slugs: string[];
  count: number;
}

