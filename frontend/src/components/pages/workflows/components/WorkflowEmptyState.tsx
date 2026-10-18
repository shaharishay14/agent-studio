import useDarkModeStore from '../../../../../store/darkmode.store';

interface WorkflowEmptyStateProps {
  onCreateWorkflow: () => void;
}

function WorkflowEmptyState({ onCreateWorkflow }: WorkflowEmptyStateProps) {
  const { isDarkMode } = useDarkModeStore();
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="relative mb-8">
        {/* Glow effect */}
        {isDarkMode && (
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl scale-150"></div>
        )}
        
        {/* Icon */}
        <div className={`relative w-24 h-24 rounded-3xl flex items-center justify-center ${
          isDarkMode
            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
            : 'bg-purple-100 border-2 border-purple-300'
        }`}>
          <svg className={`w-12 h-12 ${
            isDarkMode ? 'text-purple-400' : 'text-purple-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      <h2 className={`text-2xl font-bold mb-3 ${
        isDarkMode ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
      }`}>
        No Workflow Selected
      </h2>
      
      <p className={`text-center max-w-md mb-8 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-700'
      }`}>
        Select a workflow from the sidebar or create a new one to start building powerful automation flows
      </p>

      <button
        onClick={onCreateWorkflow}
        className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:scale-105 ${
          isDarkMode ? 'shadow-purple-500/25 hover:shadow-purple-500/40' : 'shadow-purple-500/30 hover:shadow-purple-500/50'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create New Workflow
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>
    </div>
  );
}

export default WorkflowEmptyState;

