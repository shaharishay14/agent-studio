import useDarkModeStore from '../../../../../../store/darkmode.store';
import type { UnifiedTool } from '../../types';

interface ToolsSectionProps {
  tools?: UnifiedTool[];
  onAddTool?: (toolName: string) => void;
  onRemoveTool?: (toolName: string) => void;
  onConnectTool?: (toolName: string) => void;
  onDisconnectTool?: (toolName: string) => void;
  isConnecting?: boolean;
  connectingToolName?: string | null;
  isDisconnecting?: boolean;
  disconnectingToolName?: string | null;
  isAddingTool?: boolean;
  addingToolName?: string | null;
  isRemovingTool?: boolean;
  removingToolName?: string | null;
}

export const ToolsSection = ({
  tools = [],
  onAddTool,
  onRemoveTool,
  onConnectTool,
  onDisconnectTool,
  isConnecting = false,
  connectingToolName = null,
  isDisconnecting = false,
  disconnectingToolName = null,
  isAddingTool = false,
  addingToolName = null,
  isRemovingTool = false,
  removingToolName = null
}: ToolsSectionProps) => {
  const { isDarkMode } = useDarkModeStore();
  const agentTools = tools.filter(tool => tool.is_connected_to_agent);
  const availableTools = tools.filter(tool => !tool.is_connected_to_agent);

  return (
    <div className="p-4 pt-4 space-y-4">
      {/* Description */}
      <div className={`p-3 border rounded-xl ${
        isDarkMode
          ? 'bg-blue-500/10 border-blue-500/30'
          : 'bg-blue-500/20 border-blue-500/30'
      }`}>
        <p className={`text-sm ${
          isDarkMode ? 'text-blue-200' : 'text-blue-300'
        }`}>
          Configure tools to enhance your agent's capabilities.
        </p>
      </div>

      {/* Agent Tools */}
      <div>
        <h4 className={`text-sm font-semibold mb-3 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Agent Tools
        </h4>
        <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {agentTools.length === 0 ? (
            <div className={`p-4 text-center rounded-xl ${
              isDarkMode ? 'bg-white/[0.02]' : 'bg-white/[0.03]'
            }`}>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                No tools connected yet
              </p>
            </div>
          ) : (
            agentTools.map((tool) => (
              <div key={tool.tool_name} className={`flex items-center justify-between p-3 rounded-xl ${
                isDarkMode ? 'bg-white/[0.03]' : 'bg-white/[0.02]'
              }`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                    isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-500/30'
                  }`}>
                    {tool.icon || '🔧'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {tool.name}
                    </p>
                    <p className={`text-xs truncate ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {tool.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {tool.isToolRequirePremission && tool.is_connected_to_account && (
                    <button
                      onClick={() => onDisconnectTool?.(tool.tool_name)}
                      disabled={isDisconnecting && disconnectingToolName === tool.name}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                          : 'bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-600'
                      }`}
                    >
                      {isDisconnecting && disconnectingToolName === tool.name ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Disconnecting...</span>
                        </>
                      ) : (
                        'Disconnect'
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveTool?.(tool.tool_name)}
                    disabled={isRemovingTool && removingToolName === tool.name}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        : 'bg-red-500/30 hover:bg-red-500/40 text-red-600'
                    }`}
                  >
                    {isRemovingTool && removingToolName === tool.name ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Removing...</span>
                      </>
                    ) : (
                      'Remove'
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available Tools */}
      <div>
        <h4 className={`text-sm font-semibold mb-3 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Available Tools
        </h4>
        <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {availableTools.length === 0 ? (
            <div className={`p-4 text-center rounded-xl ${
              isDarkMode ? 'bg-white/[0.02]' : 'bg-white/[0.03]'
            }`}>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                All tools are already connected
              </p>
            </div>
          ) : (
            availableTools.map((tool) => (
              <div key={tool.tool_name} className={`flex items-center justify-between p-3 rounded-xl ${
                isDarkMode ? 'bg-white/[0.03]' : 'bg-white/[0.02]'
              }`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                    isDarkMode ? 'bg-green-500/20' : 'bg-green-500/30'
                  }`}>
                    {tool.icon || '🔧'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {tool.name}
                    </p>
                    <p className={`text-xs truncate ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {tool.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {tool.isToolRequirePremission && !tool.is_connected_to_account ? (
                    <button
                      onClick={() => onConnectTool?.(tool.tool_name)}
                      disabled={isConnecting && connectingToolName === tool.name}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {isConnecting && connectingToolName === tool.name ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  ) : tool.isToolRequirePremission && tool.is_connected_to_account ? (
                    <>
                      <button
                        onClick={() => onDisconnectTool?.(tool.tool_name)}
                        disabled={isDisconnecting && disconnectingToolName === tool.name}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDarkMode
                            ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                            : 'bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-600'
                        }`}
                      >
                        {isDisconnecting && disconnectingToolName === tool.name ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Disconnecting...</span>
                          </>
                        ) : (
                          'Disconnect'
                        )}
                      </button>
                      <button
                        onClick={() => onAddTool?.(tool.tool_name)}
                        disabled={isAddingTool && addingToolName === tool.name}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDarkMode
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                        }`}
                      >
                        {isAddingTool && addingToolName === tool.name ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Adding...</span>
                          </>
                        ) : (
                          'Add'
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onAddTool?.(tool.tool_name)}
                      disabled={isAddingTool && addingToolName === tool.name}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                      }`}
                    >
                      {isAddingTool && addingToolName === tool.name ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Adding...</span>
                        </>
                      ) : (
                        'Add'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

