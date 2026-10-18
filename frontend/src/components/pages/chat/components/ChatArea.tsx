import useDarkModeStore from '../../../../../store/darkmode.store';
import useModalsStore from '../../../../../store/modals.store';
import { useGetAgentMessages, useSendMessageStream } from '../hooks';
import { LoadingState, ErrorState } from '../../../shared/components';
import type { Agent } from '../types';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInputArea } from './ChatInputArea';

interface ChatAreaProps {
  agentId: string;
  agent?: Agent;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  suggestedPrompts?: string[];
}

function ChatArea({ agentId, agent, onToggleSidebar, isSidebarOpen, suggestedPrompts = [] }: ChatAreaProps) {
  const { isDarkMode } = useDarkModeStore();
  const { openResetMemoryModal, openShareAgentModal, openTelegramBotModal } = useModalsStore();
  
  // שליפת ההודעות
  const { messages, isLoading: isLoadingMessages, isError: isErrorMessages } = useGetAgentMessages(agentId);
  
  // שליחת הודעה עם streaming (כולל state ופונקציות)
  const { 
    messageText, 
    setMessageText,
    handleSendMessage, 
    isSending,
    status,
    currentStreamingContent,
    isStreamingResponse
  } = useSendMessageStream(agentId);
  
  // שימוש ב-agent שהתקבל כ-prop
  const agentData = agent;

  // הצגת loading
  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  // הצגת שגיאה
  if (isErrorMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <ErrorState message="Error loading messages" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative transition-all duration-300 ease-in-out">
      <ChatHeader 
        isDarkMode={isDarkMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        agentData={agentData}
        agentId={agentId}
        openResetMemoryModal={openResetMemoryModal}
        openShareAgentModal={openShareAgentModal}
        openTelegramBotModal={openTelegramBotModal}
      />

      <ChatMessages 
        isDarkMode={isDarkMode}
        messages={messages}
        agentData={agentData}
        setMessageText={setMessageText}
        isStreamingResponse={isStreamingResponse}
        currentStreamingContent={currentStreamingContent}
        status={status}
      />

      <ChatInputArea 
        isDarkMode={isDarkMode}
        messageText={messageText}
        setMessageText={setMessageText}
        handleSendMessage={handleSendMessage}
        isSending={isSending}
        suggestedPrompts={suggestedPrompts}
      />
    </div>
  );
}

export default ChatArea;
