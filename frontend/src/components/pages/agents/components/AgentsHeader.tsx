import { Link } from 'react-router-dom';
import useDarkModeStore from '../../../../../store/darkmode.store';

function AgentsHeader() {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="mb-8 md:mb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 ${
              isDarkMode 
                ? 'text-white' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent pb-1'
            }`}>
              Your Agents
            </h1>
            <p className={`text-sm sm:text-base md:text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>
              Manage and interact with your AI agents
            </p>
          </div>
          
          <Link
            to="/builder"
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-2xl text-white text-sm sm:text-base font-medium hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 whitespace-nowrap ${
              isDarkMode
                ? 'hover:shadow-purple-500/40'
                : 'hover:shadow-purple-500/50'
            }`}
          >
            <span className="text-lg sm:text-xl">+</span>
            <span>Create Agent</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AgentsHeader;

