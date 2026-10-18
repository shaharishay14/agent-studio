import type { UnifiedTool, AvailableToolsResponse, AvailableAgentToolsResponse } from '../types';

interface UnifyToolsParams {
  availableTools?: AvailableToolsResponse;
  availableAgentTools?: AvailableAgentToolsResponse;
}

/**
 * מאחד כלים משתי נקודות קצה שונות לפורמט משותף
 * @param availableTools - כלים מנקודת הקצה /agents/{id}/available_tools/
 * @param availableAgentTools - כלים מנקודת הקצה /agents/{id}/available-agent-tools/
 * @returns מערך מאוחד של כלים
 */
export const unifyTools = ({
  availableTools,
  availableAgentTools,
}: UnifyToolsParams): UnifiedTool[] => {
  const unified: UnifiedTool[] = [];

  // מיפוי כלים מהנקודת קצה הראשונה /agents/{id}/available_tools/
  if (availableTools?.tools) {
    const toolsFromFirstEndpoint = availableTools.tools.map(tool => ({
      tool_name: tool.tool_name,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      is_connected_to_account: tool.is_connected_to_account,
      is_connected_to_agent: tool.is_connected_to_agent,
      connection_id: tool.connection_id,
      icon: '', // לא קיים בנקודת קצה זו
      isToolRequirePremission: true, // רק לכלים מנקודת קצה זו
    }));
    unified.push(...toolsFromFirstEndpoint);
  }

  // מיפוי כלים מהנקודת קצה השנייה /agents/{id}/available-agent-tools/
  if (availableAgentTools?.tools) {
    const toolsFromSecondEndpoint = availableAgentTools.tools.map(tool => ({
      tool_name: tool.tool_name,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      is_connected_to_account: false, // ברירת מחדל - לא קיים בנקודת קצה זו
      is_connected_to_agent: tool.is_enabled, // המרה של is_enabled
      connection_id: null, // לא קיים בנקודת קצה זו
      icon: tool.icon,
      isToolRequirePremission: false, // רק כלים מנקודת הקצה הראשונה
    }));
    unified.push(...toolsFromSecondEndpoint);
  }

  return unified;
};

