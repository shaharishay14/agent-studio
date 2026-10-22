import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { MessageSquareOff } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';
import { ChatEmptyState, ChatInputArea } from '../chat/components';
import { useSendPublicMessageStream, useGetInitialSuggestions, useGetPublicAgent } from './hooks';
import { LayoutPublicChat, PublicChatHeader, PublicChatMessages } from './components';

function PublicChat() {
  const { agentid } = useParams<{ agentid: string }>();
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>>([]);

  // The shared agent
  const { agent, isLoading, isError } = useGetPublicAgent(agentid || '');

  // Streaming replies (sent with is_ephemeral: true)
  const {
    messageText,
    setMessageText,
    handleSendMessage,
    cancelSending,
    isSending,
    status,
    currentStreamingContent,
    isStreamingResponse
  } = useSendPublicMessageStream(agentid || '', setMessages);

  // Suggested first messages from the agent's description (only before the first message)
  const { suggestedPrompts } = useGetInitialSuggestions(agent, messages.length > 0);

  if (isLoading) {
    return (
      <LayoutPublicChat>
        <div className="grid flex-1 place-items-center">
          <Spinner label="Loading chat" />
        </div>
      </LayoutPublicChat>
    );
  }

  if (isError || !agent) {
    return (
      <LayoutPublicChat>
        <div className="grid flex-1 place-items-center p-6">
          <div
            className="flex max-w-[420px] flex-col items-center gap-3 rounded-card border border-white/20 bg-night/55 p-8 text-center backdrop-blur-[20px]"
            role="alert"
          >
            <span className="grid size-14 place-items-center rounded-pill border border-white/30 bg-white/8" aria-hidden="true">
              <MessageSquareOff className="size-6" strokeWidth={1.7} />
            </span>
            <h1 className="m-0 font-display text-2xl font-medium tracking-[-0.02em]">This chat isn't available</h1>
            <p className="m-0 text-white/75">The link may be wrong, or the owner stopped sharing this agent.</p>
          </div>
        </div>
      </LayoutPublicChat>
    );
  }

  return (
    <LayoutPublicChat>
      <PublicChatHeader agent={agent} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <ChatEmptyState agentData={agent} suggestedPrompts={suggestedPrompts} setMessageText={setMessageText} />
        ) : (
          <PublicChatMessages
            messages={messages}
            isStreamingResponse={isStreamingResponse}
            currentStreamingContent={currentStreamingContent}
            status={status}
          />
        )}
      </div>

      <ChatInputArea
        agentName={agent.name}
        messageText={messageText}
        setMessageText={setMessageText}
        handleSendMessage={handleSendMessage}
        onStop={cancelSending}
        isSending={isSending}
        suggestedPrompts={[]}
        showSuggestions={false}
      />
    </LayoutPublicChat>
  );
}

export default PublicChat;
