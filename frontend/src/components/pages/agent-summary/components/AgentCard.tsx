import { formatAvatarUrl } from '../../chat/utils/formatAvatarUrl';
import { Calendar, Bot } from 'lucide-react';

interface AgentCardProps {
  name: string;
  avatar_base64: string | null;
  created_at: string;
  isDarkMode: boolean;
}

function AgentCard({ name, avatar_base64, created_at, isDarkMode }: AgentCardProps) {
  return (
    <div className={`mx-8 mb-6 rounded-2xl p-6 border backdrop-blur-sm relative overflow-hidden group ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-800/80 via-gray-800/60 to-gray-800/80 border-gray-700/50'
        : 'bg-gradient-to-br from-white/90 via-purple-50/50 to-white/90 border-gray-200'
    }`}>
      {/* Animated background gradient */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20'
          : 'bg-gradient-to-r from-purple-100/50 via-pink-100/50 to-purple-100/50'
      }`}></div>
      
      <div className="flex items-start gap-5 relative z-10">
        {/* Avatar with enhanced styling */}
        <div className="relative group/avatar">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover/avatar:opacity-75 blur transition duration-300"></div>
          
          {formatAvatarUrl(avatar_base64) ? (
            <img 
              src={formatAvatarUrl(avatar_base64)!} 
              alt={name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-purple-500/20 group-hover/avatar:ring-purple-500/40 transition-all duration-300 relative z-10"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center text-3xl shadow-xl ring-4 ring-purple-500/20 group-hover/avatar:ring-purple-500/40 group-hover/avatar:scale-110 transition-all duration-300 relative z-10">
              <Bot className="w-10 h-10 text-white" />
            </div>
          )}
        </div>
        
        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-2xl font-bold mb-2 truncate ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {name}
          </h3>
          
          <div className={`flex items-center gap-2 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <Calendar className="w-4 h-4" />
            <span>Created {new Date(created_at).toLocaleDateString('en-US', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}</span>
          </div>
          
          {/* Status Badge */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              Active & Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentCard;

