import { Handle, Position } from '@xyflow/react';
import useDarkModeStore from '../../../../../../store/darkmode.store';

interface AddAgentNodeProps {
  data: {
    onAddAgent?: () => void;
  };
}

function AddAgentNode({ data }: AddAgentNodeProps) {
  const { isDarkMode } = useDarkModeStore();
  
  return (
    <div className="relative group">
      <div className={`
        bg-gradient-to-br ${isDarkMode ? 'from-gray-800/60 to-gray-900/60' : 'from-gray-100/90 to-gray-200/90'}
        border-2 border-dashed ${isDarkMode ? 'border-purple-500/40' : 'border-purple-400/60'}
        rounded-2xl p-8 min-w-[240px] max-w-[280px]
        transition-all duration-300
        group-hover:border-purple-500/60 group-hover:shadow-lg group-hover:shadow-purple-500/20
        flex flex-col items-center justify-center gap-4
      `}>
        <Handle 
          type="target" 
          position={Position.Left}
          className="!w-3 !h-3 !bg-pink-500 !border-2 !border-pink-400"
        />
        
        <button
          onClick={data.onAddAgent}
          className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-pink-500/40 hover:shadow-pink-500/60 hover:scale-110 active:scale-95"
        >
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center gap-1">
          <div className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Add Agent
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Click to add a new step
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddAgentNode;

