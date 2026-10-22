import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

import { cn } from '@/lib/utils';
import { MarkdownImageLink } from '../../../shared/components';
import { isHebrewText } from '../utils';
import type { Message } from '../types';

const markdown = (content: string) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: MarkdownImageLink }}>
    {content.replace(/\\n/g, '\n')}
  </ReactMarkdown>
);

// User bubbles are white with dark text; agent bubbles are dark glass.
const bubbleClass = (role: Message['role']) =>
  role === 'user'
    ? 'self-end rounded-[20px_20px_6px_20px] border border-white bg-white text-on-white'
    : 'self-start rounded-[20px_20px_20px_6px] border border-white/20 bg-night/35 text-white backdrop-blur-[12px]';

interface ChatMessageProps {
  // Only these fields are shown, so public-chat messages fit too
  message: Pick<Message, 'role' | 'content' | 'created_at'>;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = message.role === 'user';
  const isHebrew = isHebrewText(message.content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className={cn('group flex max-w-[88%] flex-col gap-1.5 md:max-w-[78%]', isUser ? 'items-end self-end' : 'items-start self-start')}>
      <div className={cn('px-4 py-[11px]', bubbleClass(message.role))}>
        <div dir={isHebrew ? 'rtl' : 'ltr'} className={cn('sky-prose', isUser && 'sky-prose-ink')}>
          {markdown(message.content)}
        </div>
      </div>
      <div className="flex items-center gap-1 px-1 text-xs text-white/55">
        <time dateTime={message.created_at}>
          {new Date(message.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </time>
        {/* Visible on hover and keyboard focus; always visible on touch screens */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={isCopied ? 'Copied' : 'Copy message'}
          className={cn(
            'inline-grid size-7 place-items-center rounded-pill text-white/70 transition-opacity hover:bg-white/10 hover:text-white',
            'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white [@media(hover:none)]:opacity-100'
          )}
        >
          {isCopied ? <Check className="size-3.5 text-live" strokeWidth={1.7} /> : <Copy className="size-3.5" strokeWidth={1.7} />}
        </button>
      </div>
    </div>
  );
};

// The agent's reply while it streams in, with a blinking caret
export const StreamingMessage = ({ content }: { content: string }) => {
  const isHebrew = isHebrewText(content);
  return (
    <div className={cn('max-w-[88%] px-4 py-[11px] md:max-w-[78%]', bubbleClass('assistant'))} aria-live="polite" aria-busy="true">
      <div dir={isHebrew ? 'rtl' : 'ltr'} className="sky-prose">
        {markdown(content)}
        <span className="sky-caret !h-[18px]" aria-hidden="true" />
      </div>
    </div>
  );
};
