import MessageBubble from './MessageBubble';
import { StreamingMessageBubble } from './StreamingMessageBubble';

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

function PublicChatMessages({ 
  messages, 
  isStreamingResponse, 
  currentStreamingContent,
  status 
}: PublicChatMessagesProps) {
  return (
    <div className="space-y-8">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      
      {/* Streaming message in progress */}
      {isStreamingResponse && currentStreamingContent && (
        <StreamingMessageBubble content={currentStreamingContent} />
      )}
      
      {/* Status indicator when streaming */}
      {status && (
        <div className="flex justify-center my-2">
          <div style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }} className="px-4 py-2 rounded-full text-sm bg-purple-500/20 text-purple-300 border">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              {status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicChatMessages;

