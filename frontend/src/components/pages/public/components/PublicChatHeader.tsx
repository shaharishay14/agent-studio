import { Link } from 'react-router-dom';
import type { Agent } from '../../chat/types';

interface PublicChatHeaderProps {
  agent: Agent;
}

function PublicChatHeader({ agent }: PublicChatHeaderProps) {
  return (
    <div style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} className="relative border-b bg-transparent">
      <div className="max-w-full mx-auto px-3 sm:px-6 py-3 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 group">
            {/* Agent Avatar with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl blur-md sm:blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                <img 
                  src={"/assets/agent.png"} 
                  alt={agent.name} 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent truncate">
                  {agent.name}
                </h1>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50 flex-shrink-0"></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 line-clamp-1">
                {agent.prompt.substring(0, 80)}...
              </p>
            </div>
          </div>
          
          {/* Created by badge with special design */}
          <Link 
            to={import.meta.env.VITE_FRONT_URL || '/'} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ borderColor: 'rgba(55, 65, 81, 0.5)' }}
            className="group relative px-5 py-2.5 rounded-xl text-xs font-medium border-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 text-gray-300 hover:text-white transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-purple-500/20 hover:scale-105 [&:hover]:!border-[rgba(168,85,247,0.5)] flex-shrink-0 hidden sm:flex"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-gray-500 group-hover:text-purple-400 transition-colors">powered by</span>
              <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Agent Studio</span>
            </span>
            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/0 via-purple-600/10 to-pink-600/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PublicChatHeader;

