import type { ModalFooterProps } from './types';

export function ModalFooter({ isDarkMode }: ModalFooterProps) {
  return (
    <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl ${
      isDarkMode ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'
    }`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <span className="text-xl sm:text-2xl">✨</span>
        </div>
        <div className="min-w-0">
          <h4 className={`text-sm sm:text-base font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            🚀 Ready to Go Viral!
          </h4>
          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
            Share with confidence
          </p>
          <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            ✨ <span className={isDarkMode ? 'text-purple-400' : 'text-purple-600'}>Pro tip:</span> Your agent data stays private while the chat experience goes public. Perfect for demos, showcases, and viral content!
          </p>
        </div>
      </div>
    </div>
  );
}

