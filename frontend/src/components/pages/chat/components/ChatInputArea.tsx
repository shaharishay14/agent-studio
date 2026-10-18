import { useState, useMemo } from 'react';
import { isHebrewText } from '../utils';
import { useManageFiles } from '../hooks';

interface ChatInputAreaProps {
  isDarkMode: boolean;
  messageText: string;
  setMessageText: (text: string) => void;
  handleSendMessage: (message: string, files?: File[]) => void;
  isSending: boolean;
  suggestedPrompts: string[];
}

export const ChatInputArea = ({
  isDarkMode,
  messageText,
  setMessageText,
  handleSendMessage,
  isSending,
  suggestedPrompts
}: ChatInputAreaProps) => {
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
    handleSendMessage(messageText, attachedFiles);
    
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
    <div className={`border-t backdrop-blur-sm transition-all duration-300 ${
      showSuggestions && suggestedPrompts.length > 0 ? 'p-3 md:p-6' : 'p-2 md:p-4'
    } ${
      isDarkMode
        ? 'border-white/[0.08] bg-gradient-to-r from-gray-900/50 to-gray-900/80'
        : 'border-purple-200 bg-gradient-to-r from-white/90 via-purple-50/50 to-pink-50/50'
    }`}>
      <div className="w-full md:w-[90%] mx-auto">
        {/* Suggested Prompts */}
        {showSuggestions && suggestedPrompts.length > 0 && (
          <div className="mb-4 relative animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Close Button */}
            <button
              onClick={handleHideSuggestions}
              className={`absolute right-0 top-0 p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                isDarkMode
                  ? 'hover:bg-white/[0.08] text-gray-400 hover:text-gray-300'
                  : 'hover:bg-purple-100 text-gray-600 hover:text-purple-700'
              }`}
              title="Hide suggestions"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setMessageText(prompt)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 hover:scale-105 ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 text-gray-200'
                      : 'bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border border-purple-300 text-purple-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`rounded-2xl p-3 border backdrop-blur-sm ${
          isDarkMode
            ? 'bg-white/[0.03] border-white/[0.08]'
            : 'bg-white/60 border-purple-300 shadow-lg'
        }`}>
          {/* Attached Files Display */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-white/[0.05] border-white/[0.1] text-gray-300'
                      : 'bg-purple-50 border-purple-200 text-purple-900'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate max-w-[150px]" title={file.name}>
                      {file.name}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className={`p-1 rounded-md transition-all duration-200 hover:scale-110 ${
                      isDarkMode
                        ? 'hover:bg-red-500/20 text-red-400'
                        : 'hover:bg-red-100 text-red-600'
                    }`}
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
              className={`p-3 rounded-xl transition-all duration-200 ${
                isDarkMode
                  ? 'hover:bg-white/[0.08] text-gray-400 disabled:opacity-50'
                  : 'hover:bg-purple-100 text-purple-700 disabled:opacity-50'
              } disabled:cursor-not-allowed`}
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
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPressWithFiles}
                placeholder="Type your message..."
                disabled={isSending}
                dir={isHebrew ? 'rtl' : 'ltr'}
                className={`w-full bg-transparent py-3 px-2 focus:outline-none ${
                  isDarkMode
                    ? 'text-white placeholder:text-gray-500'
                    : 'text-gray-900 placeholder:text-gray-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>
            
            <button 
              onClick={handleSendWithFiles}
              disabled={isSending || !messageText.trim()}
              className={`p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                isDarkMode ? 'hover:shadow-purple-500/50' : 'hover:shadow-purple-500/60'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-pink-600 disabled:hover:scale-100`}
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
};

