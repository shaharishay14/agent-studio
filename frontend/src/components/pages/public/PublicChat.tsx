import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { LoadingState, ErrorState } from '../../shared/components';
import { useSendPublicMessageStream, useGetInitialSuggestions, useGetPublicAgent } from './hooks';
import { 
  LayoutPublicChat,
  PublicChatHeader, 
  PublicChatWelcome, 
  PublicChatMessages, 
  PublicChatInput 
} from './components';

function PublicChat() {
  const { agentid } = useParams<{ agentid: string }>();
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>>([]);

  // שליפת נתוני האייג'נט
  const { agent, isLoading, isError } = useGetPublicAgent(agentid || '');

  // שליחת הודעה עם streaming (עם is_ephemeral: true)
  const { 
    messageText, 
    setMessageText, 
    handleSendMessage, 
    isSending,
    status,
    currentStreamingContent,
    isStreamingResponse
  } = useSendPublicMessageStream(agentid || '', setMessages);

  // קבלת הצעות דינמיות על סמך תיאור ה-agent (רק כשאין הודעות)
  const { suggestedPrompts } = useGetInitialSuggestions(agent, messages.length > 0);

  // הצגת loading
  if (isLoading) {
    return (
      <LayoutPublicChat>
        <div className="flex-1 flex items-center justify-center">
          <LoadingState />
        </div>
      </LayoutPublicChat>
    );
  }

  // הצגת שגיאה
  if (isError || !agent) {
    return (
      <LayoutPublicChat>
        <div className="flex-1 flex items-center justify-center">
          <ErrorState message="Error loading agent" />
        </div>
      </LayoutPublicChat>
    );
  }

  return (
    <LayoutPublicChat>
      {/* Header */}
        <PublicChatHeader agent={agent} />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto chat-scrollbar">
        <div className="w-full mx-auto">
          {messages.length === 0 ? (
            <PublicChatWelcome agent={agent} />
          ) : (
            <PublicChatMessages 
              messages={messages}
              isStreamingResponse={isStreamingResponse}
              currentStreamingContent={currentStreamingContent}
              status={status}
            />
          )}
        </div>
      </div>

      {/* Input Area */}
      <PublicChatInput
        messageText={messageText}
        onMessageChange={setMessageText}
        onSendMessage={(files = []) => handleSendMessage(messageText, files)}
        suggestions={suggestedPrompts}
        isSending={isSending}
      />
    </LayoutPublicChat>
  );
}

export default PublicChat;

