import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import useDarkModeStore from '../../../../store/darkmode.store';

function AgentLoading() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkModeStore();

  useEffect(() => {
    // בדיקה אם יש מידע של agent חדש ב-sessionStorage
    const checkAgentData = setInterval(() => {
      const storedData = sessionStorage.getItem('newAgentData');
      if (storedData) {
        // נמצא מידע - ממתין 2 שניות ואז מנווט לעמוד הסיכום
        clearInterval(checkAgentData);
        setTimeout(() => {
          navigate('/agent-summary');
        }, 2000);
      }
    }, 100);

    // ניקוי ה-interval כאשר הקומפוננטה מתנתקת
    return () => clearInterval(checkAgentData);
  }, [navigate]);

  return (
    <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' 
        : 'bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30'
    }`}>
      <div className="relative max-w-md w-full mx-4">
        <div className={`bg-gradient-to-br rounded-3xl shadow-2xl p-8 border transition-colors duration-300 ${
          isDarkMode 
            ? 'from-gray-900 to-gray-800 border-gray-700/50' 
            : 'from-white to-gray-50 border-gray-200/50'
        }`}>
          {/* Animated Agent Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Orbiting dots */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 rounded-full"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-500 rounded-full"></div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>

              {/* Center Icon */}
              <div className="relative flex items-center justify-center">
                <img 
                  src="/assets/gif/agent_happy.gif" 
                  alt="Agent loading" 
                  className="w-32 h-32 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Title with animated dots */}
          <div className="text-center mb-4">
            <h2 className={`text-2xl md:text-3xl font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Creating your agent
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </h2>
          </div>

          {/* Progress Bar */}
          <div className={`relative w-full h-2 rounded-full overflow-hidden mb-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 animate-progress"></div>
          </div>

          {/* Status Messages */}
          <div className="space-y-3 text-center">
            <p className={`text-lg flex items-center justify-center gap-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <Sparkles className={`w-5 h-5 animate-pulse transition-colors duration-300 ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
              }`} />
              Analyzing your requirements...
            </p>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              This may take a few moments
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default AgentLoading;

