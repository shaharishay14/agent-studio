import { Workflow } from 'lucide-react';

interface WorkflowSidebarToggleButtonProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export const WorkflowSidebarToggleButton = ({ isDarkMode, onToggle }: WorkflowSidebarToggleButtonProps) => {
  return (
    <div className="absolute top-4 left-4 z-50">
      {/* Button */}
      <button
        onClick={onToggle}
        className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isDarkMode
            ? 'bg-gradient-to-br from-purple-500/80 via-pink-500/70 to-purple-600/80 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 border border-purple-400/50 hover:border-purple-400/70 shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 backdrop-blur-sm'
            : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-2 border-purple-400 shadow-xl hover:shadow-2xl'
        }`}
        aria-label="Open workflow sidebar"
      >
        <Workflow 
          className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-white'}`}
        />
      </button>
    </div>
  );
};

export default WorkflowSidebarToggleButton;

