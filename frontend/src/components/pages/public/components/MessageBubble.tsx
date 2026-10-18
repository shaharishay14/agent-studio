import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
}

// פונקציה לזיהוי טקסט עברית
const isHebrewText = (text: string): boolean => {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
};

function MessageBubble({ message }: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
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
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex gap-3 max-w-full md:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div 
          style={{ borderColor: message.role === 'user' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)' }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
            message.role === 'user'
              ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
              : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
          }`}>
          <span className="text-sm">{message.role === 'user' ? '👤' : '🤖'}</span>
        </div>

        {/* Message Content */}
        <div 
          style={{ borderColor: message.role === 'user' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)' }}
          className={`rounded-2xl px-4 py-3 relative border ${
            message.role === 'user'
              ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20'
              : 'bg-white/[0.05]'
          }`}>
          <div 
            dir={isHebrew ? 'rtl' : 'ltr'}
            className={`text-sm prose prose-sm max-w-none ${
              message.role === 'user'
                ? 'prose-invert [&>*]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_strong]:text-white [&_li]:text-white [&_p]:text-sm'
                : 'prose-invert [&>*]:text-gray-200 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_strong]:text-gray-100 [&_code]:text-purple-300 [&_p]:text-sm'
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
          
          <div className="flex items-center justify-between mt-2 min-h-[20px]">
            <span className={`text-xs ${
              message.role === 'user'
                ? 'text-blue-200'
                : 'text-gray-500'
            }`}>
              {new Date(message.created_at).toLocaleTimeString('he-IL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            
            {/* Copy Button - appears on hover */}
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              } ${
                message.role === 'user'
                  ? 'hover:bg-blue-500/20 text-blue-200'
                  : 'hover:bg-white/[0.08] text-gray-400 hover:text-gray-300'
              }`}
            >
              {isCopied ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;

