type Frequency = 'daily' | 'weekly' | 'monthly';

interface CronScheduleConfigProps {
  frequency: Frequency;
  hour: string;
  minute: string;
  onFrequencyChange: (frequency: Frequency) => void;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
}

function CronScheduleConfig({ 
  frequency, 
  hour, 
  minute, 
  onFrequencyChange, 
  onHourChange, 
  onMinuteChange 
}: CronScheduleConfigProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Configure Schedule</h3>
            <p className="text-gray-400 text-sm">Set when your trigger should run</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/30 border-2 border-gray-700/50 rounded-2xl p-6 space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Frequency
          </label>
          <div className="relative">
            <select
              value={frequency}
              onChange={(e) => onFrequencyChange(e.target.value as Frequency)}
              className="w-full appearance-none bg-gray-900/80 border-2 border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-orange-500 cursor-pointer transition-all"
            >
              <option value="daily">Daily - Runs every day</option>
              <option value="weekly">Weekly - Runs once per week</option>
              <option value="monthly">Monthly - Runs once per month</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hour (Local Time)
            </label>
            <div className="relative">
              <select
                value={hour}
                onChange={(e) => onHourChange(e.target.value)}
                className="w-full appearance-none bg-gray-900/80 border-2 border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-orange-500 cursor-pointer transition-all"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const h = i.toString().padStart(2, '0');
                  return <option key={h} value={`${h}:00`}>{h}:00</option>;
                })}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Minute
            </label>
            <div className="relative">
              <select
                value={minute}
                onChange={(e) => onMinuteChange(e.target.value)}
                className="w-full appearance-none bg-gray-900/80 border-2 border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-orange-500 cursor-pointer transition-all"
              >
                {['00', '15', '30', '45'].map((m) => (
                  <option key={m} value={m}>:{m}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-2 border-blue-500/40 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-bold text-blue-200 text-base mb-1">Scheduled Time</div>
            <div className="text-blue-100 text-lg font-semibold mb-1">
              {hour.split(':')[0]}:{minute} {frequency === 'daily' ? 'Every Day' : frequency === 'weekly' ? 'Every Week' : 'Every Month'}
            </div>
            <div className="text-blue-300/80 text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Time shown in your local timezone
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CronScheduleConfig;

