import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDarkModeStore from '../../../../store/darkmode.store';
import type { Agent } from '../builder/types';
import { SuccessIcon, SummaryTitle, AgentCard, ActionButtons } from './components';

function AgentSummary() {
  const { isDarkMode } = useDarkModeStore();
  const navigate = useNavigate();
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Get agent data from sessionStorage
    const storedData = sessionStorage.getItem('newAgentData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as Agent;
        setAgentData(data);
        // Clear from sessionStorage after reading
        sessionStorage.removeItem('newAgentData');
        
        // Trigger animation
        setTimeout(() => setIsVisible(true), 100);
      } catch (error) {
        console.error('Error parsing agent data:', error);
        navigate('/builder');
      }
    } else {
      // No data found, redirect to builder
      // navigate('/builder');
    }
  }, [navigate]);

  if (!agentData) {
    return null;
  }

  const { id, name, created_at, avatar_base64 } = agentData;

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900'
        : 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50'
    }`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20 ${
          isDarkMode ? 'bg-purple-600' : 'bg-purple-300'
        } animate-blob`}></div>
        <div className={`absolute top-40 right-10 w-72 h-72 rounded-full blur-3xl opacity-20 ${
          isDarkMode ? 'bg-pink-600' : 'bg-pink-300'
        } animate-blob animation-delay-2000`}></div>
        <div className={`absolute -bottom-20 left-1/2 w-72 h-72 rounded-full blur-3xl opacity-20 ${
          isDarkMode ? 'bg-indigo-600' : 'bg-indigo-300'
        } animate-blob animation-delay-4000`}></div>
      </div>

      {/* Main Card */}
      <div className={`relative max-w-2xl w-full my-8 rounded-3xl shadow-2xl border backdrop-blur-sm transform transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      } ${
        isDarkMode
          ? 'bg-gray-900/90 border-gray-700/50'
          : 'bg-white/90 border-gray-200'
      }`}>
        {/* Gradient border effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl opacity-20 blur-sm"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <SuccessIcon />
          <SummaryTitle isDarkMode={isDarkMode} />
          <AgentCard 
            name={name}
            avatar_base64={avatar_base64}
            created_at={created_at}
            isDarkMode={isDarkMode}
          />
          <ActionButtons agentId={id} />
        </div>
      </div>
    </div>
  );
}

export default AgentSummary;

