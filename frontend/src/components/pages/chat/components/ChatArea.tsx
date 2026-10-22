import useModalsStore from '../../../../../store/modals.store';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useGetAgentMessages, useSendMessageStream } from '../hooks';
import type { Agent } from '../types';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInputArea } from './ChatInputArea';

interface ChatAreaProps {
  agentId: string;
  agent?: Agent;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  suggestedPrompts?: string[];
}

function ChatArea({ agentId, agent, isSettingsOpen, onToggleSettings, suggestedPrompts = [] }: ChatAreaProps) {
  const { openResetMemoryModal, openShareAgentModal, openTelegramBotModal } = useModalsStore();

  // שליפת ההודעות
  const { messages, isLoading: isLoadingMessages, isError: isErrorMessages, refetch } = useGetAgentMessages(agentId);

  // שליחת הודעה עם streaming (כולל state ופונקציות)
  const {
    messageText,
    setMessageText,
    handleSendMessage,
    cancelSending,
    isSending,
    currentStreamingContent,
    isStreamingResponse,
    pendingApproval,
    isDecidingApproval,
    respondToApproval,
    steps,
  } = useSendMessageStream(agentId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader
        agentData={agent}
        agentId={agentId}
        isWorking={isSending}
        needsApproval={!!pendingApproval}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={onToggleSettings}
        openResetMemoryModal={openResetMemoryModal}
        openShareAgentModal={openShareAgentModal}
        openTelegramBotModal={openTelegramBotModal}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoadingMessages && (
          <div className="grid h-full place-items-center">
            <Spinner label="Loading messages" />
          </div>
        )}

        {isErrorMessages && (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center" role="alert">
            <p className="m-0 text-white/80">We couldn't load this conversation.</p>
            <Button variant="glass" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isLoadingMessages && !isErrorMessages && (
          <ChatMessages
            messages={messages}
            agentData={agent}
            setMessageText={setMessageText}
            suggestedPrompts={suggestedPrompts}
            isSending={isSending}
            isStreamingResponse={isStreamingResponse}
            currentStreamingContent={currentStreamingContent}
            steps={steps}
            pendingApproval={pendingApproval}
            isDecidingApproval={isDecidingApproval}
            onApprovalDecision={respondToApproval}
          />
        )}
      </div>

      <ChatInputArea
        agentName={agent?.name}
        messageText={messageText}
        setMessageText={setMessageText}
        handleSendMessage={handleSendMessage}
        onStop={cancelSending}
        isSending={isSending}
        suggestedPrompts={suggestedPrompts}
        showSuggestions={messages.length > 0}
      />
    </div>
  );
}

export default ChatArea;
