import { Code, Copy } from 'lucide-react';
import type { ShareEmbedTabProps } from './types';

export function ShareEmbedTab({ isDarkMode, embedCode, onCopy }: ShareEmbedTabProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0">
          <Code className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            ⚡ Embed Anywhere
          </h3>
          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Add to your website, blog, or app
          </p>
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Embed Code
          </span>
          <button
            onClick={() => onCopy(embedCode, 'Embed code')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 ${
              isDarkMode
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Copy
          </button>
        </div>
        <pre className={`p-3 sm:p-4 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-mono whitespace-pre-wrap break-words ${
          isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-900 text-gray-100'
        }`}>
          <code>{embedCode}</code>
        </pre>
      </div>
    </div>
  );
}

