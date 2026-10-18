import { Loader2 } from 'lucide-react';
import useDarkModeStore from '../../../../../store/darkmode.store';

function ChatLoader() {
  const { isDarkMode } = useDarkModeStore();
  
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 md:gap-4 p-4 md:p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="relative">
        {/* Animated gradient ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 blur-xl opacity-50 animate-pulse" />
        
        {/* Loader icon */}
        <Loader2 
          size={40}
          className="md:w-12 md:h-12 relative text-purple-600 animate-spin"
          strokeWidth={2.5}
        />
      </div>
      
      <div className="text-center space-y-1 md:space-y-2">
        <p className="text-base md:text-lg font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
          Loading Agent...
        </p>
        <p className="text-xs md:text-sm text-gray-500">
          Just a moment
        </p>
      </div>
      
      {/* Animated dots */}
      <div className="flex gap-1.5 md:gap-2">
        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export default ChatLoader;

