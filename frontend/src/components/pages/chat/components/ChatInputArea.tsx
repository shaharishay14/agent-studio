import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, FileText, Paperclip, Square, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/button';
import { isHebrewText } from '../utils';
import { useManageFiles } from '../hooks';

interface ChatInputAreaProps {
  agentName?: string;
  messageText: string;
  setMessageText: (text: string) => void;
  handleSendMessage: (message: string, files?: File[]) => void;
  onStop: () => void;
  isSending: boolean;
  suggestedPrompts: string[];
  showSuggestions: boolean;
}

// Glass composer at the bottom of the chat: suggested prompts, attached files, auto-growing
// message box, attach, and Send (Stop while the agent is working).
export const ChatInputArea = ({
  agentName,
  messageText,
  setMessageText,
  handleSendMessage,
  onStop,
  isSending,
  suggestedPrompts,
  showSuggestions,
}: ChatInputAreaProps) => {
  const [suggestionsHidden, setSuggestionsHidden] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // File management hook
  const { attachedFiles, fileInputRef, handleFileButtonClick, handleFileChange, handleRemoveFile, formatFileSize, clearFiles } = useManageFiles();

  // פונקציה לשליחת הודעה עם קבצים
  const handleSendWithFiles = () => {
    if (!messageText.trim() || isSending) return;
    handleSendMessage(messageText, attachedFiles);
    clearFiles();
  };

  // Enter sends, Shift+Enter adds a line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendWithFiles();
    }
  };

  // Grow with the text, up to 180px
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [messageText]);

  const isHebrew = useMemo(() => isHebrewText(messageText), [messageText]);
  const suggestions = showSuggestions && !suggestionsHidden ? suggestedPrompts.slice(0, 3) : [];

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-4 sm:px-7 sm:pb-7">
      {suggestions.length > 0 && (
        <div className="mb-3 flex animate-sky-in items-center gap-2 overflow-x-auto pb-1">
          {suggestions.map((prompt) => (
            <Chip key={prompt} onClick={() => setMessageText(prompt)} className="shrink-0">
              {prompt}
            </Chip>
          ))}
          <IconButton size="sm" aria-label="Hide suggestions" onClick={() => setSuggestionsHidden(true)} className="shrink-0">
            <X />
          </IconButton>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendWithFiles();
        }}
        className="rounded-[26px] border border-edge bg-[rgba(14,18,26,0.72)] px-[18px] pt-3.5 pb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-[24px] backdrop-saturate-[1.4]"
      >
        {attachedFiles.length > 0 && (
          <ul className="m-0 mb-2.5 flex list-none flex-wrap gap-2 p-0" aria-label="Attached files">
            {attachedFiles.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-pill border border-white/25 bg-white/8 py-1 pr-1 pl-3 text-sm">
                <FileText className="size-3.5 shrink-0 text-white/70" strokeWidth={1.7} aria-hidden="true" />
                <span className="max-w-[160px] truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-xs text-white/55">{formatFileSize(file.size)}</span>
                <IconButton size="sm" aria-label={`Remove ${file.name}`} onClick={() => handleRemoveFile(index)} className="size-6">
                  <X />
                </IconButton>
              </li>
            ))}
          </ul>
        )}

        <label htmlFor="chat-message" className="sr-only">
          Message {agentName || 'your agent'}
        </label>
        <textarea
          id="chat-message"
          ref={textareaRef}
          rows={1}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${agentName || 'your agent'}…`}
          disabled={isSending}
          dir={isHebrew ? 'rtl' : 'ltr'}
          className="block max-h-[180px] min-h-[30px] w-full resize-none overflow-y-auto border-0 bg-transparent px-1.5 py-1 text-base leading-[26px] text-white outline-none placeholder:text-white/55 disabled:opacity-60"
        />

        {/* Hidden File Input */}
        <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" tabIndex={-1} aria-hidden="true" />

        <div className="mt-2 flex items-center gap-1.5">
          <IconButton aria-label="Attach files" onClick={handleFileButtonClick} disabled={isSending}>
            <Paperclip />
          </IconButton>
          {isSending ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop"
              className="ml-auto inline-grid size-10 place-items-center rounded-pill border border-white/55 bg-white/10 text-white hover:bg-white/18 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
            >
              <Square className="size-3.5 fill-current" strokeWidth={1.7} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!messageText.trim()}
              aria-label="Send"
              className={cn(
                'ml-auto inline-grid size-10 place-items-center rounded-pill bg-white text-on-white transition-transform duration-150',
                'hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
              )}
            >
              <ArrowUp className="size-4" strokeWidth={1.7} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
