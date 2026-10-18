type TriggerType = 'cron' | 'app_event' | null;

interface TriggerTypeSelectorProps {
  selectedType: TriggerType;
  onSelect: (type: TriggerType) => void;
}

function TriggerTypeSelector({ selectedType, onSelect }: TriggerTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Select Trigger Type</h3>
        <p className="text-gray-400 text-sm">Choose how your agent will be triggered</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => onSelect('cron')}
          className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 ${
            selectedType === 'cron'
              ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-red-500/10 shadow-lg shadow-orange-500/20'
              : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              selectedType === 'cron'
                ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30'
                : 'bg-gray-700/50 group-hover:bg-gray-700'
            }`}>
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <span className="font-bold text-white text-base block mb-1">CRON Schedule</span>
              <span className="text-xs text-gray-400">Time-based automation</span>
            </div>
          </div>
          {selectedType === 'cron' && (
            <div className="absolute top-3 right-3">
              <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
        <button
          onClick={() => onSelect('app_event')}
          className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 ${
            selectedType === 'app_event'
              ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-red-500/10 shadow-lg shadow-orange-500/20'
              : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              selectedType === 'app_event'
                ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30'
                : 'bg-gray-700/50 group-hover:bg-gray-700'
            }`}>
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-center">
              <span className="font-bold text-white text-base block mb-1">App Events</span>
              <span className="text-xs text-gray-400">Event-driven automation</span>
            </div>
          </div>
          {selectedType === 'app_event' && (
            <div className="absolute top-3 right-3">
              <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default TriggerTypeSelector;

