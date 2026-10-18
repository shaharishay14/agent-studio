import type { Integration } from './types';
import useDarkModeStore from '../../../../../store/darkmode.store';

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onViewDetails: (id: string) => void;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
}

function IntegrationCard({ integration, onConnect, onDisconnect, onViewDetails, isConnecting = false, isDisconnecting = false }: IntegrationCardProps) {
  const { isDarkMode } = useDarkModeStore();
  
  return (
    <div className={`group relative rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl backdrop-blur-md overflow-hidden ${
      isDarkMode
        ? 'bg-gradient-to-br from-purple-900/5 via-gray-900/30 to-blue-900/5 border border-white/[0.08] hover:from-purple-900/20 hover:via-blue-900/20 hover:to-purple-900/20 hover:border-purple-500/30 hover:shadow-purple-500/20'
        : 'bg-white/70 border border-purple-200 hover:bg-gradient-to-br hover:from-purple-100 hover:via-pink-50 hover:to-purple-100 hover:border-purple-400 hover:shadow-purple-500/30'
    }`}>
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 transition-all duration-300 pointer-events-none ${
        isDarkMode
          ? 'bg-gradient-to-r from-purple-500/[0.02] via-blue-500/[0.02] to-purple-500/[0.02] group-hover:from-purple-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5'
          : 'bg-gradient-to-r from-purple-100/20 via-pink-50/20 to-purple-100/20 group-hover:from-purple-200/30 group-hover:via-pink-100/30 group-hover:to-purple-200/30'
      }`}></div>
      
      <div className="relative z-10 flex flex-col gap-4">
        {/* Header */}
        <div className="flex gap-3 items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300 ${
            isDarkMode
              ? 'bg-white/[0.08]'
              : 'bg-purple-100 border border-purple-200'
          }`}>
            {integration.icon}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className={`text-base font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {integration.name}
              </h3>
              {integration.isConnected && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isDarkMode
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-green-100 text-green-700 border border-green-300'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Active
                </span>
              )}
            </div>
            <p className={`text-xs leading-snug ${
              isDarkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>
              {integration.description}
            </p>
          </div>
          
          {/* Category Tag */}
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs lowercase ${
            isDarkMode
              ? 'bg-white/[0.05] border border-white/[0.1] text-gray-400'
              : 'bg-purple-100 border border-purple-300 text-purple-700'
          }`}>
            {integration.category}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button 
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
              isDarkMode
                ? 'bg-white/[0.05] border border-white/[0.1] text-gray-400 hover:bg-white/[0.08] hover:text-white'
                : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100/70 hover:text-purple-900 hover:border-purple-400'
            }`}
            onClick={() => onViewDetails(integration.id)}
          >
            <span className="text-sm">ⓘ</span>
            <span>View Details</span>
          </button>
          
          {integration.isConnected ? (
            <button 
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                isDarkMode
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
              }`}
              onClick={() => onDisconnect(integration.id)}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Disconnecting...
                </span>
              ) : (
                'Disconnect'
              )}
            </button>
          ) : (
            <button 
              className={`flex-1 px-3 py-2 bg-gradient-to-r rounded-xl text-xs font-medium text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
                isDarkMode
                  ? 'from-blue-600 to-green-600 hover:shadow-blue-400/30'
                  : 'from-blue-500 to-green-500 hover:shadow-blue-500/40'
              }`}
              onClick={() => onConnect(integration.id)}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                'Connect'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IntegrationCard;

