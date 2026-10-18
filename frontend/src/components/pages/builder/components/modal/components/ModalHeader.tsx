import { X, Settings as SettingsIcon } from 'lucide-react';
import useDarkModeStore from '../../../../../../../store/darkmode.store';

interface ModalHeaderProps {
  onClose: () => void;
}

function ModalHeader({ onClose }: ModalHeaderProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="flex items-start justify-between mb-4 sm:mb-6">
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <SettingsIcon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`text-lg sm:text-2xl font-bold truncate ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Manual Mode Setup
          </h2>
        </div>
        <p className={`text-xs sm:text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Customize your agent step by step
        </p>
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

export default ModalHeader;

