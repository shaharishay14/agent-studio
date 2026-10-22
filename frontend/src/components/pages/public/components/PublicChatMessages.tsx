import { useEffect, useRef } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { ChatMessage, StreamingMessage } from '../../chat/components/ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface PublicChatMessagesProps {
  messages: Message[];
  isStreamingResponse?: boolean;
  currentStreamingContent?: string;
  status?: string;
}

function PublicChatMessages({ messages, isStreamingResponse, currentStreamingContent, status }: PublicChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, currentStreamingContent, status]);

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4 px-4 py-8 sm:px-7" role="log" aria-label="Conversation">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isStreamingResponse && currentStreamingContent && <StreamingMessage content={currentStreamingContent} />}

      {/* What the agent is doing right now (e.g. running a tool) */}
      {status && (
        <p
          className="m-0 inline-flex items-center gap-2.5 self-start rounded-pill border border-white/20 bg-night/40 px-3.5 py-2 text-[13px] text-white/85 backdrop-blur-[12px]"
          role="status"
        >
          <Spinner size={14} />
          {status}
        </p>
      )}

      <div ref={endRef} />
    </div>
  );
}

export default PublicChatMessages;
