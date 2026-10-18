import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingMessageBubbleProps {
  content: string;
}

// פונקציה לזיהוי טקסט עברית
const isHebrewText = (text: string): boolean => {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
};

export const StreamingMessageBubble = ({ content }: StreamingMessageBubbleProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const isHebrew = isHebrewText(content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div 
      className="flex justify-start"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-3 max-w-full md:max-w-[80%]">
        {/* Avatar */}
        <div style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border">
          <span className="text-sm">🤖</span>
        </div>

        {/* Message Content */}
        <div style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} className="rounded-2xl px-4 py-3 relative bg-white/[0.05] border">
          <div 
            dir={isHebrew ? 'rtl' : 'ltr'}
            className="text-sm prose prose-sm max-w-none prose-invert [&>*]:text-gray-200 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_strong]:text-gray-100 [&_code]:text-purple-300 [&_p]:text-sm"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
            <span className="inline-block w-1 h-4 bg-purple-500 animate-pulse ml-0.5 align-middle"></span>
          </div>
          
          {/* Copy Button - appears on hover */}
          <div className="flex justify-end mt-2 min-h-[20px]">
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              } hover:bg-white/[0.08] text-gray-400 hover:text-gray-300`}
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
};

