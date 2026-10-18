interface AppEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
}

interface EventConfig {
  interval: string;
  labelIds: string;
  query: string;
  userId: string;
}

interface AppEventConfigProps {
  mockEvents: AppEvent[];
  selectedEvent: string | null;
  showDropdown: boolean;
  eventConfig: EventConfig;
  onEventSelect: (eventId: string) => void;
  onToggleDropdown: () => void;
  onConfigChange: (config: EventConfig) => void;
}

function AppEventConfig({
  mockEvents,
  selectedEvent,
  showDropdown,
  eventConfig,
  onEventSelect,
  onToggleDropdown,
  onConfigChange
}: AppEventConfigProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Select App Event</h3>
            <p className="text-gray-400 text-sm">Choose which event should trigger your agent</p>
          </div>
        </div>
      </div>

      {/* Dropdown for selecting event */}
      <div className="relative">
        <button
          onClick={onToggleDropdown}
          className="w-full bg-gray-800/50 border-2 border-gray-700 hover:border-orange-500 rounded-xl px-4 py-3.5 text-left flex items-center justify-between transition-all"
        >
          <span className={selectedEvent ? 'text-white font-medium' : 'text-gray-500'}>
            {selectedEvent 
              ? mockEvents.find(e => e.id === selectedEvent)?.name 
              : 'Select a trigger type'}
          </span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border-2 border-gray-700 rounded-xl shadow-2xl z-10 max-h-80 overflow-y-auto">
            {mockEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-0"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-2xl">
                    {event.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{event.name}</div>
                    <div className="text-gray-400 text-xs">{event.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => onEventSelect(event.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration fields when event is selected */}
      {selectedEvent && (
        <div className="space-y-6 mt-6">
          <div className="bg-gray-800/30 border-2 border-gray-700/50 rounded-2xl p-6 space-y-5">
            <h4 className="text-lg font-bold text-white mb-4">Configuration</h4>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Interval
              </label>
              <input
                type="text"
                value={eventConfig.interval}
                onChange={(e) => onConfigChange({...eventConfig, interval: e.target.value})}
                className="w-full bg-gray-900/80 border-2 border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-2">Default: 1</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                LabelIds
              </label>
              <input
                type="text"
                value={eventConfig.labelIds}
                onChange={(e) => onConfigChange({...eventConfig, labelIds: e.target.value})}
                className="w-full bg-gray-900/80 border-2 border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                placeholder="INBOX"
              />
              <p className="text-xs text-gray-500 mt-2">Default: "INBOX" • Examples: "INBOX", "UNREAD", "STARRED"</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Query
              </label>
              <textarea
                value={eventConfig.query}
                onChange={(e) => onConfigChange({...eventConfig, query: e.target.value})}
                className="w-full bg-gray-900/80 border-2 border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 resize-none"
                rows={3}
                placeholder="Advanced Gmail search using the same syntax as Gmail's search box..."
              />
              <p className="text-xs text-gray-500 mt-2">Use 'AND' for multiple conditions</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                UserId
              </label>
              <input
                type="text"
                value={eventConfig.userId}
                onChange={(e) => onConfigChange({...eventConfig, userId: e.target.value})}
                className="w-full bg-gray-900/80 border-2 border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                placeholder="me"
              />
              <p className="text-xs text-gray-500 mt-2">Default: "me" • Examples: "me"</p>
            </div>
          </div>

          {/* Event Payload Schema */}
          <div className="bg-blue-900/10 border-2 border-blue-500/30 rounded-2xl p-5">
            <button className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">Event Payload Schema</div>
                  <div className="text-blue-300 text-xs">9 fields available</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div className="mt-4 p-4 bg-blue-900/20 rounded-xl">
              <p className="text-xs text-blue-200 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  <strong>Tip:</strong> The event payload will be automatically included as part of the input to your agent when this trigger fires. You can reference these fields in your message above using their field names.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppEventConfig;

