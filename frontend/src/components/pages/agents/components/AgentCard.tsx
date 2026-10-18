import { useNavigate } from 'react-router-dom';
import type { Agent } from '../types';
import useDarkModeStore from '../../../../../store/darkmode.store';
import useModalsStore from '../../../../../store/modals.store';
import { formatAvatarUrl } from '../../chat/utils';

interface AgentCardProps {
  agent: Agent;
  onDelete: (id: string) => void;
}

function AgentCard({ agent, onDelete }: AgentCardProps) {
  const { isDarkMode } = useDarkModeStore();
  const { openShareAgentModal } = useModalsStore();
  const navigate = useNavigate();
  const avatarUrl = formatAvatarUrl(agent.avatar_base64);

  const handleCardClick = () => {
    navigate(`/chat/${agent.id}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    openShareAgentModal(agent.id, agent.name);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(agent.id);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative h-full flex flex-col rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl backdrop-blur-sm overflow-hidden cursor-pointer ${
        isDarkMode
          ? 'bg-gradient-to-br from-purple-900/5 via-gray-900/30 to-pink-900/5 border border-white/[0.08] hover:from-purple-900/20 hover:via-pink-900/20 hover:to-purple-900/20 hover:border-purple-500/30 hover:shadow-purple-500/20'
          : 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 border border-purple-300 hover:from-purple-100 hover:via-pink-100 hover:to-purple-200 hover:border-purple-400 hover:shadow-purple-500/30'
      }`}>
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 transition-all duration-300 pointer-events-none ${
        isDarkMode
          ? 'bg-gradient-to-r from-purple-500/[0.02] via-pink-500/[0.02] to-purple-500/[0.02] group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-purple-500/5'
          : 'bg-gradient-to-r from-purple-200/30 via-pink-100/30 to-purple-200/30 group-hover:from-purple-300/40 group-hover:via-pink-200/40 group-hover:to-purple-300/40'
      }`}></div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header with Icon and Info */}
        <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
          {avatarUrl ? (
            <img 
              src={avatarUrl}
              alt={agent.name}
              className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl group-hover:scale-110 transition-transform duration-300 object-cover"
            />
          ) : (
            <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center text-2xl md:text-3xl group-hover:scale-110 transition-transform duration-300">
              🤖
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg md:text-xl font-semibold mb-1.5 md:mb-2 truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {agent.name}
            </h3>
            <p className={`text-xs md:text-sm line-clamp-2 leading-relaxed ${
              isDarkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>
              {agent.prompt}
            </p>
          </div>
        </div>

        {/* Created Date and Message Count */}
        <div className={`border-t pt-3 md:pt-4 mb-3 md:mb-4 ${
          isDarkMode ? 'border-white/[0.08]' : 'border-purple-200'
        }`}>
          <div className="flex justify-between items-center text-xs md:text-sm mb-1.5 md:mb-2">
            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Created</span>
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              {new Date(agent.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs md:text-sm">
            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Messages</span>
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{agent.message_count}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 md:gap-3 mt-auto">
          <button 
            onClick={handleShare}
            className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all duration-300 group/btn ${
              isDarkMode
                ? 'bg-white/[0.05] hover:bg-white/[0.08]'
                : 'bg-purple-100 hover:bg-purple-200 border border-purple-300'
            }`}
            aria-label="Share agent"
          >
            <svg
              className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${
                isDarkMode
                  ? 'text-gray-400 group-hover/btn:text-white'
                  : 'text-purple-700 group-hover/btn:text-purple-900'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
          
          <button 
            onClick={handleDelete}
            className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all duration-300 group/btn ${
              isDarkMode
                ? 'bg-red-500/10 hover:bg-red-500/20'
                : 'bg-red-100 hover:bg-red-200 border border-red-300'
            }`}
            aria-label="Delete agent"
          >
            <svg
              className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${
                isDarkMode
                  ? 'text-red-400 group-hover/btn:text-red-300'
                  : 'text-red-600 group-hover/btn:text-red-700'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AgentCard;

