import { RotateCcw, Share2, Send } from 'lucide-react';
import { DndContext } from '@dnd-kit/core';
import { formatAvatarUrl } from '../utils';
import { DraggableButton, useDraggableButton } from './drags';
import type { Agent } from '../types';

interface ChatHeaderProps {
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  agentData?: Agent;
  agentId: string;
  openResetMemoryModal: (id: string) => void;
  openShareAgentModal: (id: string, name: string) => void;
  openTelegramBotModal: (id: string) => void;
}

export const ChatHeader = ({
  isDarkMode,
  isSidebarOpen,
  onToggleSidebar,
  agentData,
  agentId,
  openResetMemoryModal,
  openShareAgentModal,
  openTelegramBotModal
}: ChatHeaderProps) => {
  const avatarUrl = formatAvatarUrl(agentData?.avatar_base64);
  
  // Use draggable button hook
  const { isMobile, buttonPosition, hasUserDragged, sensors, handleDragEnd } = useDraggableButton();

  return (
    <div className={`border-b backdrop-blur-md relative ${
      isDarkMode
        ? 'border-white/[0.05] bg-gradient-to-r from-gray-900/30 to-gray-900/50'
        : 'border-purple-100/50 bg-gradient-to-r from-white/70 via-purple-50/30 to-pink-50/30'
    }`}>
      <div className="flex items-center justify-between p-2 md:p-4">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div 
              className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-xl md:text-2xl overflow-hidden flex-shrink-0 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                  : 'bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-purple-300 shadow-lg'
              }`}
              style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
              {!avatarUrl && '🤖'}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={`text-sm md:text-lg font-semibold truncate ${
                isDarkMode ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
              }`}>
                {agentData?.name || 'Agent'}
              </h1>
              <div className="flex items-center gap-1 md:gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 ${
                  isDarkMode ? 'bg-green-400' : 'bg-green-500'
                }`}></div>
                <span className={`text-[10px] md:text-xs truncate ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  💎 still hasn't been shared with others
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button 
            onClick={() => openResetMemoryModal(agentId)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-white/[0.05] hover:bg-white/[0.08]'
                : 'bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border border-purple-300'
            }`}
            title="Reset Memory"
          >
            <RotateCcw className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-white' : 'text-purple-700'}`} />
          </button>
          
          <button 
            onClick={() => {
              const url = window.location.href;
              window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
            }}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-green-500/20 hover:bg-green-500/30'
                : 'bg-green-100 hover:bg-green-200 border border-green-300'
            }`}
            title="Share on WhatsApp"
          >
            <svg className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>
          
          <button 
            onClick={() => openTelegramBotModal(agentId)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-blue-500/20 hover:bg-blue-500/30'
                : 'bg-blue-100 hover:bg-blue-200 border border-blue-300'
            }`}
            title="Connect to Telegram"
          >
            <Send className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </button>
          
          <button 
            onClick={() => openShareAgentModal(agentId, agentData?.name || 'Agent')}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30'
                : 'bg-emerald-100 hover:bg-emerald-200 border border-emerald-300'
            }`}
            title="Share Agent"
          >
            <Share2 className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </button>
        </div>
      </div>

      {/* Sidebar Toggle Button - positioned at the bottom of header when closed */}
      {!isSidebarOpen && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <DraggableButton
            isDarkMode={isDarkMode}
            onToggle={onToggleSidebar}
            isMobile={isMobile}
            position={buttonPosition}
            showHint={!hasUserDragged}
          />
        </DndContext>
      )}
    </div>
  );
};

