import { useState, useEffect } from 'react';
import useDarkModeStore from '../../../../store/darkmode.store';
import useModalsStore from '../../../../store/modals.store';
import { X, Trash2 } from 'lucide-react';
import { useConnectTelegramBot, useGetTelegramBot, useDisconnectTelegramBot } from '../../pages/chat/hooks';
import type { TelegramBotResponse } from '../../pages/chat/types';

function TelegramBotModal() {
  const { isDarkMode } = useDarkModeStore();
  const { telegramBotModal, closeTelegramBotModal } = useModalsStore();
  const [botToken, setBotToken] = useState('');
  const [connectedBot, setConnectedBot] = useState<TelegramBotResponse | null>(null);
  
  const agentId = telegramBotModal.agentId || '';
  const connectBot = useConnectTelegramBot(agentId);
  const disconnectBot = useDisconnectTelegramBot(agentId);
  const { data: existingBot } = useGetTelegramBot(agentId);

  // טעינת הבוט הקיים כאשר המודל נפתח
  useEffect(() => {
    if (telegramBotModal.isOpen && existingBot) {
      setConnectedBot(existingBot);
    }
  }, [telegramBotModal.isOpen, existingBot]);

  // איפוס המצב כאשר המודל נסגר
  useEffect(() => {
    if (!telegramBotModal.isOpen) {
      setBotToken('');
      setConnectedBot(null);
    }
  }, [telegramBotModal.isOpen]);

  if (!telegramBotModal.isOpen) return null;

  const handleConnect = async () => {
    if (!botToken.trim()) return;
    
    try {
      const result = await connectBot.mutateAsync({ bot_token: botToken.trim() });
      setConnectedBot(result);
      setBotToken('');
    } catch (error) {
      // השגיאה כבר מטופלת ב-hook
      console.error('Error connecting bot:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectBot.mutateAsync();
      setConnectedBot(null);
    } catch (error) {
      // השגיאה כבר מטופלת ב-hook
      console.error('Error disconnecting bot:', error);
    }
  };

  const handleClose = () => {
    setBotToken('');
    setConnectedBot(null);
    closeTelegramBotModal();
  };

  const handleOpenChat = () => {
    if (connectedBot?.bot_username) {
      window.open(`https://t.me/${connectedBot.bot_username}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-lg rounded-xl sm:rounded-2xl shadow-2xl border max-h-[95vh] overflow-y-auto ${
          isDarkMode 
            ? 'bg-[#1a1a1a] border-gray-800' 
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-lg transition-colors z-10 ${
            isDarkMode
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 sm:p-6">
          {/* Header with Icon */}
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6 pr-8 sm:pr-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className={`text-xl sm:text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Telegram Bot
              </h2>
              <p className={`mt-0.5 sm:mt-1 text-sm sm:text-base ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Connect your agent to Telegram
              </p>
            </div>
          </div>

          {/* Connected Bot Display */}
          {connectedBot ? (
            <div className="space-y-3 sm:space-y-4">
              <div className={`rounded-lg sm:rounded-xl border p-3 sm:p-4 ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-semibold text-sm sm:text-base ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        agent
                      </h3>
                      <p className={`text-xs sm:text-sm truncate ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        @{connectedBot.bot_username}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 flex-shrink-0">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs sm:text-sm font-medium text-green-500 hidden xs:inline">Connected</span>
                  </span>
                </div>

                <div className={`flex items-start gap-2 p-2.5 sm:p-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-xs sm:text-sm ${
                    isDarkMode ? 'text-green-400' : 'text-green-700'
                  }`}>
                    Bot is active and ready to receive messages
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2.5 sm:mt-3">
                  <button
                    onClick={handleOpenChat}
                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm ${
                      isDarkMode
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="hidden xs:inline">Open Chat</span>
                    <span className="xs:hidden">Chat</span>
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className={`p-2 sm:p-2.5 rounded-lg transition-all ${
                      isDarkMode
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Bot Token Input */}
              <div className="mb-4 sm:mb-6">
                <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Bot Token
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Enter your Telegram bot token (e.g., 123456:ABC-DEF)"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                    isDarkMode
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Instructions Box */}
              <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border ${
                isDarkMode 
                  ? 'bg-blue-500/10 border-blue-500/30' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-xs sm:text-sm font-medium mb-2 sm:mb-3 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-700'
                }`}>
                  How to get your Telegram Bot Token:
                </p>
                <ol className={`space-y-1.5 sm:space-y-2 text-xs sm:text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <li className="flex items-start gap-1.5 sm:gap-2">
                    <span className={`font-bold flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>1.</span>
                    <span>
                      Open BotFather:{' '}
                      <a 
                        href="https://t.me/botfather" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline font-medium break-all"
                      >
                        https://t.me/botfather
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5 sm:gap-2">
                    <span className={`font-bold flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>2.</span>
                    <span>
                      Create new bot by typing <code className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs ${
                        isDarkMode ? 'bg-gray-800 text-blue-400' : 'bg-white text-blue-600'
                      }`}>/newbot</code>
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5 sm:gap-2">
                    <span className={`font-bold flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>3.</span>
                    <span>Set bot name and username (username must end with "bot")</span>
                  </li>
                  <li className="flex items-start gap-1.5 sm:gap-2">
                    <span className={`font-bold flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>4.</span>
                    <span>Copy the token BotFather provides and paste it above</span>
                  </li>
                </ol>
              </div>

              {/* Action Button */}
              <button
                onClick={handleConnect}
                disabled={!botToken.trim() || connectBot.isPending}
                className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {connectBot.isPending ? (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TelegramBotModal;

