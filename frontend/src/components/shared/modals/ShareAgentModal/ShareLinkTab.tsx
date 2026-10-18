import { Link, Copy, ExternalLink } from 'lucide-react';
import type { ShareLinkTabProps } from './types';

export function ShareLinkTab({ isDarkMode, agentLink, onCopy }: ShareLinkTabProps) {
  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
          <Link className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            🚀 Instant Share Link
          </h3>
          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Copy & paste anywhere to spread the word
          </p>
        </div>
      </div>

      <div className={`flex items-start gap-2 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl mb-3 sm:mb-4 ${
        isDarkMode ? 'bg-gray-950/80' : 'bg-gray-900'
      }`}>
        <code className={`flex-1 text-xs sm:text-sm font-mono break-all ${
          isDarkMode ? 'text-gray-300' : 'text-gray-200'
        }`}>
          {agentLink}
        </code>
        <button
          onClick={() => window.open(agentLink, '_blank')}
          className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
            isDarkMode ? 'hover:bg-white/10' : 'hover:bg-white/20'
          }`}
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      <button
        onClick={() => onCopy(agentLink, 'Link')}
        className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 rounded-lg sm:rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2 sm:gap-2.5 shadow-lg text-sm sm:text-base"
      >
        <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
        📋 Copy & Share Now
      </button>
    </div>
  );
}

