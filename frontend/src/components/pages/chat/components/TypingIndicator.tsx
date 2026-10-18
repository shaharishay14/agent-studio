import { formatAvatarUrl } from '../utils';
import type { Agent } from '../types';

interface TypingIndicatorProps {
  isDarkMode: boolean;
  agentData?: Agent;
}

export const TypingIndicator = ({ isDarkMode, agentData }: TypingIndicatorProps) => {
  const avatarUrl = formatAvatarUrl(agentData?.avatar_base64);

  return (
    <div className="flex justify-start">
      <div className="flex gap-3 max-w-full md:max-w-[80%]">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
            : 'bg-gradient-to-br from-purple-400 to-pink-500 border border-purple-300'
        }`}>
          {avatarUrl ? (
            <img 
              src={avatarUrl}
              alt={agentData?.name || 'Agent'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm">🤖</span>
          )}
        </div>

        {/* Animated dots */}
        <div className={`rounded-2xl px-4 py-3 ${
          isDarkMode
            ? 'bg-white/[0.05] border border-white/[0.1]'
            : 'bg-white border border-purple-200 shadow-md'
        }`}>
          <div className="flex items-center gap-1.5">
            <span 
              className={`w-2 h-2 rounded-full ${
                isDarkMode ? 'bg-purple-400' : 'bg-purple-600'
              }`}
              style={{
                animation: 'bounce-dot 1.4s ease-in-out infinite',
                animationDelay: '0ms'
              }}
            ></span>
            <span 
              className={`w-2 h-2 rounded-full ${
                isDarkMode ? 'bg-purple-400' : 'bg-purple-600'
              }`}
              style={{
                animation: 'bounce-dot 1.4s ease-in-out infinite',
                animationDelay: '200ms'
              }}
            ></span>
            <span 
              className={`w-2 h-2 rounded-full ${
                isDarkMode ? 'bg-purple-400' : 'bg-purple-600'
              }`}
              style={{
                animation: 'bounce-dot 1.4s ease-in-out infinite',
                animationDelay: '400ms'
              }}
            ></span>
          </div>
          <style>{`
            @keyframes bounce-dot {
              0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.7;
              }
              30% {
                transform: translateY(-10px);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

