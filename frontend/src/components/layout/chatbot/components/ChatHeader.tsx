import { X, MessageCircle } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
}

function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 p-4 md:p-5 flex items-center justify-between backdrop-blur-xl">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 pointer-events-none" />
      
      <div className="flex items-center gap-3 md:gap-4 relative z-10">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-md opacity-60" />
          <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <MessageCircle size={20} className="md:w-6 md:h-6 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-white font-bold text-base md:text-lg bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            AI Support Copilot
          </h3>
          <p className="text-gray-400 text-xs md:text-sm">Always here to help</p>
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="relative z-10 text-gray-400 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/10 group"
        aria-label="Close chat"
      >
        <X size={18} className="md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-200" />
      </button>
    </div>
  );
}

export default ChatHeader;

