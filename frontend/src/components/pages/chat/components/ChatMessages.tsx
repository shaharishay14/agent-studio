import { ChatMessage } from './ChatMessage';
import { StreamingMessage } from './StreamingMessage';
import { ChatEmptyState } from './ChatEmptyState';
import { TypingIndicator } from './TypingIndicator';
import type { Agent, Message } from '../types';

interface ChatMessagesProps {
  isDarkMode: boolean;
  messages: Message[];
  agentData?: Agent;
  setMessageText: (text: string) => void;
  isStreamingResponse: boolean;
  currentStreamingContent: string;
  status: string;
}

export const ChatMessages = ({
  isDarkMode,
  messages,
  agentData,
  setMessageText,
  isStreamingResponse,
  currentStreamingContent,
  status
}: ChatMessagesProps) => {
  return (
    <div className="flex-1 p-2 md:p-6 overflow-y-auto chat-scrollbar">
      <div className="w-full mx-auto">
        {messages.length === 0 ? (
          <ChatEmptyState 
            isDarkMode={isDarkMode} 
            agentData={agentData} 
            setMessageText={setMessageText} 
          />
        ) : (
          <div className="space-y-8">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isDarkMode={isDarkMode}
                agentData={agentData}
              />
            ))}
            
            {/* Streaming message in progress */}
            {isStreamingResponse && currentStreamingContent && (
              <StreamingMessage 
                isDarkMode={isDarkMode} 
                content={currentStreamingContent}
                agentData={agentData}
              />
            )}
            
            {/* Status indicator when streaming - 3 dots animation on left side */}
            {status && status.toLowerCase().includes('analyzing') && (
              <TypingIndicator 
                isDarkMode={isDarkMode}
                agentData={agentData}
              />
            )}
            
            {/* Other status messages */}
            {status && !status.toLowerCase().includes('analyzing') && (
              <div className="flex justify-center my-2">
                <div className={`px-4 py-2 rounded-full text-sm ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border border-purple-300'
                }`}>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                    {status}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

