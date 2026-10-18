import { Link } from 'react-router-dom';
import { MessageSquare, Grid3x3 } from 'lucide-react';

interface ActionButtonsProps {
  agentId: string;
}

function ActionButtons({ agentId }: ActionButtonsProps) {
  return (
    <div className="px-8 pb-8">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Go to Agent Button */}
        <Link to={`/chat/${agentId}`} className="flex-1">
          <button className="w-full group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]">
            {/* Shine effect */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700"></div>
            
            <div className="flex items-center justify-center gap-3 relative z-10">
              <MessageSquare className="w-5 h-5" />
              <span>Start Chatting</span>
              <div className="w-2 h-2 rounded-full bg-white animate-ping absolute right-0"></div>
            </div>
          </button>
        </Link>
        
        {/* Go to Agents Button */}
        <Link to="/agents" className="flex-1">
          <button className="w-full group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]">
            {/* Shine effect */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700"></div>
            
            <div className="flex items-center justify-center gap-3 relative z-10">
              <Grid3x3 className="w-5 h-5" />
              <span>View All Agents</span>
            </div>
          </button>
        </Link>
      </div>
      
      {/* Helper Text */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          💡 Tip: You can customize your agent settings anytime from the chat interface
        </p>
      </div>
    </div>
  );
}

export default ActionButtons;

