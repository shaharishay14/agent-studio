import { useEffect, useRef } from 'react';

import { ThinkingTrace, type TraceStep } from '@/components/ui/thinking-trace';
import { ChatMessage, StreamingMessage } from './ChatMessage';
import { ChatEmptyState } from './ChatEmptyState';
import { ApprovalCard } from './ApprovalCard';
import type { Agent, Message, ToolApprovalRequest, ApprovalDecision } from '../types';

interface ChatMessagesProps {
  messages: Message[];
  agentData?: Agent;
  setMessageText: (text: string) => void;
  suggestedPrompts: string[];
  isSending: boolean;
  isStreamingResponse: boolean;
  currentStreamingContent: string;
  steps: TraceStep[];
  pendingApproval: ToolApprovalRequest | null;
  isDecidingApproval: boolean;
  onApprovalDecision: (decision: ApprovalDecision) => void;
}

// The thread: bubbles, then for the current turn the thinking trace (live agent loop steps),
// the streaming reply and the approval card.
export const ChatMessages = ({
  messages,
  agentData,
  setMessageText,
  suggestedPrompts,
  isSending,
  isStreamingResponse,
  currentStreamingContent,
  steps,
  pendingApproval,
  isDecidingApproval,
  onApprovalDecision,
}: ChatMessagesProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest content in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, currentStreamingContent, steps.length, pendingApproval]);

  if (messages.length === 0 && !isSending) {
    return <ChatEmptyState agentData={agentData} suggestedPrompts={suggestedPrompts} setMessageText={setMessageText} />;
  }

  // The trace belongs to the turn after the latest user message
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user');
  const before = steps.length > 0 || isSending ? messages.slice(0, lastUserIndex + 1) : messages;
  const after = steps.length > 0 || isSending ? messages.slice(lastUserIndex + 1) : [];
  const showTrace = isSending || steps.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4 px-4 py-8 sm:px-7" role="log" aria-label="Conversation">
      {before.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {showTrace && (
        <ThinkingTrace
          key={messages[lastUserIndex]?.id ?? 'turn'}
          defaultOpen
          className="w-full self-start"
          steps={steps}
          working={isSending && !currentStreamingContent}
          title={pendingApproval ? 'Waiting for you' : 'Working on it'}
          doneTitle={`Worked through ${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`}
        />
      )}

      {isStreamingResponse && currentStreamingContent && <StreamingMessage content={currentStreamingContent} />}

      {after.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {pendingApproval && (
        <ApprovalCard approval={pendingApproval} isDeciding={isDecidingApproval} onDecision={onApprovalDecision} />
      )}

      <div ref={endRef} />
    </div>
  );
};
