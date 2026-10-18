import { Search, Wrench } from 'lucide-react';
import useDarkModeStore from '../../../../../../../store/darkmode.store';

interface Tool {
  name: string;
  tool_name?: string;
  slug?: string;
  description: string;
  category: string;
}

interface ToolSelectionStepProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredTools: Tool[];
  selectedTools: string[];
  toggleTool: (toolName: string) => void;
  isLoadingTools: boolean;
  getToolIcon: (toolName: string, category: string) => string;
}

function ToolSelectionStep({
  searchTerm,
  setSearchTerm,
  filteredTools,
  selectedTools,
  toggleTool,
  isLoadingTools,
  getToolIcon
}: ToolSelectionStepProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="space-y-2 sm:space-y-4 flex flex-col h-full min-h-0">
      <div className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border text-xs sm:text-sm flex-shrink-0 ${
        isDarkMode
          ? 'bg-blue-500/10 border-blue-500/30'
          : 'bg-blue-50 border-blue-300'
      }`}>
        <p className={`${
          isDarkMode ? 'text-blue-300' : 'text-blue-700'
        }`}>
          Select the tools your agent will have access to. You can always change these later.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative flex-shrink-0">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tools..."
          className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 outline-none transition-all text-sm sm:text-base ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
          }`}
        />
      </div>

      {/* Selected Tools Counter */}
      {selectedTools.length > 0 && (
        <div className={`text-xs sm:text-sm font-medium flex-shrink-0 ${
          isDarkMode ? 'text-purple-400' : 'text-purple-600'
        }`}>
          {selectedTools.length} {selectedTools.length === 1 ? 'tool' : 'tools'} selected
        </div>
      )}

      {/* Tools Grid */}
      <div className="flex-1 min-h-0 max-h-[180px] sm:max-h-[340px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
        {isLoadingTools ? (
          <div className="flex items-center justify-center py-12">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
              isDarkMode ? 'border-purple-500' : 'border-purple-600'
            }`}></div>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className={`w-12 h-12 mx-auto mb-3 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>
              {searchTerm ? 'No tools found matching your search' : 'No tools available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {filteredTools.map((tool) => {
              // נשתמש ב-slug אם קיים, אחרת ב-tool_name, אחרת ב-name
              const toolId = tool.slug || tool.tool_name || tool.name;
              const isSelected = selectedTools.includes(toolId);
              
              return (
                <button
                  key={toolId}
                  onClick={() => {
                    toggleTool(toolId);
                  }}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                        : 'bg-purple-50 border-purple-500 shadow-lg shadow-purple-500/10'
                      : isDarkMode
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0 ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-purple-500/30'
                          : 'bg-purple-500/20'
                        : isDarkMode
                          ? 'bg-gray-700'
                          : 'bg-gray-100'
                    }`}>
                      {getToolIcon(tool.name, tool.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-xs sm:text-sm font-semibold truncate ${
                          isSelected
                            ? isDarkMode ? 'text-purple-300' : 'text-purple-700'
                            : isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {tool.name}
                        </h4>
                        {isSelected && (
                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isDarkMode ? 'bg-purple-500' : 'bg-purple-600'
                          }`}>
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className={`text-xs line-clamp-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {tool.description}
                      </p>
                      {tool.category && (
                        <div className="mt-1.5 sm:mt-2">
                          <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                            isDarkMode
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {tool.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolSelectionStep;

