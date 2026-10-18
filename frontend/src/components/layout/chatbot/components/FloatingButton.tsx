import { MessageCircle } from 'lucide-react';
import useDarkModeStore from '../../../../../store/darkmode.store';

interface FloatingButtonProps {
  onClick: () => void;
}

function FloatingButton({ onClick }: FloatingButtonProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      <button
        onClick={onClick}
        className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center group"
        aria-label="Open chat"
      >
        {/* Outer Gradient Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-[3px] group-hover:p-[3.5px] transition-all">
          <div className={`w-full h-full rounded-full ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`} />
        </div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
        
        {/* Icon */}
        <MessageCircle 
          size={20}
          strokeWidth={2.5}
          className={`relative z-10 w-5 h-5 md:w-[22px] md:h-[22px] ${isDarkMode ? 'text-white' : 'text-gray-900'} group-hover:scale-110 transition-transform`}
        />
      </button>
    </div>
  );
}

export default FloatingButton;

