import { Plus, Settings as SettingsIcon } from 'lucide-react';
import useDarkModeStore from '../../../../../../../store/darkmode.store';

interface TriggersStepProps {
  onAddTrigger: () => void;
}

function TriggersStep({ onAddTrigger }: TriggersStepProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className={`text-base sm:text-lg font-semibold mb-1 sm:mb-2 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            Automated Triggers
          </h3>
          <p className={`text-xs sm:text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Set up automated messages and actions for your agent
          </p>
        </div>
        <button
          onClick={onAddTrigger}
          className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all flex-shrink-0 ${
            isDarkMode
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          } shadow-lg hover:shadow-xl`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Trigger</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Empty State */}
      <div className="text-center py-12 sm:py-16">
        <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-3 sm:mb-4 ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <SettingsIcon className={`w-8 h-8 sm:w-10 sm:h-10 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
        </div>
        
        <h4 className={`text-sm sm:text-base font-semibold mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          No triggers configured yet
        </h4>
        
        <p className={`text-xs sm:text-sm ${
          isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          Add automated triggers to make your agent proactive
        </p>
      </div>
    </div>
  );
}

export default TriggersStep;

