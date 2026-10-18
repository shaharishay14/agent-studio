import { X } from 'lucide-react';
import type { ModalHeaderProps } from './types';

export function ModalHeader({ isDarkMode, agentName, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4 sm:mb-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-500 to-orange-500">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
        <div>
          <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Spread the Magic ✨
          </h2>
          <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
            {agentName || 'Agent'} is ready to go viral!
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
          isDarkMode
            ? 'text-gray-400 hover:text-white hover:bg-white/10'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

