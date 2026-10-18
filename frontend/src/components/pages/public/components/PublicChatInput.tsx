import { useState, useMemo } from 'react';
import { useManageFiles } from '../../chat/hooks';

interface PublicChatInputProps {
  messageText: string;
  onMessageChange: (text: string) => void;
  onSendMessage: (files?: File[]) => void;
  suggestions: string[];
  isSending?: boolean;
}

// פונקציה לזיהוי טקסט עברית
const isHebrewText = (text: string): boolean => {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
};

function PublicChatInput({ 
  messageText, 
  onMessageChange, 
  onSendMessage,
  suggestions,
  isSending = false
}: PublicChatInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // File management hook
  const {
    attachedFiles,
    fileInputRef,
    handleFileButtonClick,
    handleFileChange,
    handleRemoveFile,
    formatFileSize,
    clearFiles,
  } = useManageFiles();

  const handleHideSuggestions = () => {
    setShowSuggestions(false);
  };

  // פונקציה לשליחת הודעה עם קבצים
  const handleSendWithFiles = () => {
    if (!messageText.trim() || isSending) return;
    
    // שליחת ההודעה עם הקבצים
    onSendMessage(attachedFiles);
    
    // ניקוי הקבצים אחרי שליחה
    clearFiles();
  };

  // טיפול ב-Enter
  const handleKeyPressWithFiles = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithFiles();
    }
  };

  // Detect if text is Hebrew
  const isHebrew = useMemo(() => isHebrewText(messageText), [messageText]);

  return (
    <div style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} className={`border-t backdrop-blur-sm transition-all duration-300 ${
      showSuggestions && suggestions.length > 0 ? 'p-6' : 'p-4'
    } bg-gradient-to-r from-gray-900/50 to-gray-900/80`}>
      <div className="w-full mx-auto">
        {/* Suggested Prompts */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-4 relative animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Close Button */}
            <button
              onClick={handleHideSuggestions}
              className="absolute right-0 top-0 p-1.5 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-white/[0.08] text-gray-400 hover:text-gray-300"
              title="Hide suggestions"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
              {suggestions.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => onMessageChange(prompt)}
                  style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all duration-200 hover:scale-105 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border text-gray-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} className="rounded-2xl p-3 border backdrop-blur-sm bg-white/[0.03]">
          {/* Attached Files Display */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white/[0.05] text-gray-300"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate max-w-[150px]" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 rounded-md transition-all duration-200 hover:scale-110 hover:bg-red-500/20 text-red-400"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button 
              onClick={handleFileButtonClick}
              disabled={isSending}
              className="p-3 rounded-xl transition-all duration-200 hover:bg-white/[0.08] text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach files"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
            <div className="flex-1">
              <input
                type="text"
                value={messageText}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyPress={handleKeyPressWithFiles}
                placeholder="Type your message..."
                disabled={isSending}
                dir={isHebrew ? 'rtl' : 'ltr'}
                className="w-full bg-transparent py-3 px-2 focus:outline-none text-white placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            <button 
              onClick={handleSendWithFiles}
              disabled={isSending || !messageText.trim()}
              className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-pink-600 disabled:hover:scale-100"
            >
              {isSending ? (
                <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicChatInput;

