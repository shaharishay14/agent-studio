import useDarkModeStore from '../../../../../../store/darkmode.store';

interface TriggersSectionProps {
  onCreateTrigger?: () => void;
}

export const TriggersSection = ({ onCreateTrigger }: TriggersSectionProps) => {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="p-4 pt-4 space-y-4">
      {/* Description */}
      <div className={`p-3 border rounded-xl ${
        isDarkMode
          ? 'bg-orange-500/10 border-orange-500/30'
          : 'bg-orange-500/20 border-orange-500/30'
      }`}>
        <p className={`text-sm ${
          isDarkMode ? 'text-orange-200' : 'text-orange-700'
        }`}>
          Set up automated triggers to execute your agent on a schedule.
        </p>
      </div>

      {/* Create Trigger Button */}
      <button 
        onClick={onCreateTrigger}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
      >
        <span className="text-lg">+</span>
        Create Trigger
      </button>

      {/* Empty State */}
      <div className="text-center py-8">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isDarkMode ? 'bg-white/[0.05]' : 'bg-purple-50'
        }`}>
          <svg className={`w-10 h-10 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className={`text-base font-semibold mb-1 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>No triggers configured</p>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-500' : 'text-gray-600'
        }`}>Create your first trigger to get started</p>
      </div>
    </div>
  );
};

