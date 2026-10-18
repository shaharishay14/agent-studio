import { useRef } from 'react';
import useDarkModeStore from '../../../../../../store/darkmode.store';
import { formatAvatarUrl } from '../../utils';

interface BasicSettingsSectionProps {
  agentName: string;
  setAgentName: (name: string) => void;
  agentPrompt: string;
  setAgentPrompt: (prompt: string) => void;
  onSaveSettings: () => void;
  isSaving: boolean;
  selectedAvatar?: File | null;
  previewUrl?: string | null;
  onAvatarSelect?: (file: File | null) => void;
  agentAvatar?: string | null;
}

export const BasicSettingsSection = ({
  agentName,
  setAgentName,
  agentPrompt,
  setAgentPrompt,
  onSaveSettings,
  isSaving,
  selectedAvatar,
  previewUrl,
  onAvatarSelect,
  agentAvatar
}: BasicSettingsSectionProps) => {
  const { isDarkMode } = useDarkModeStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const formattedAvatar = formatAvatarUrl(agentAvatar || null);

  return (
    <div className="p-4 pt-4 space-y-4">
      {/* Avatar Section */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Avatar
        </label>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/svg+xml,image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            onAvatarSelect?.(file);
          }}
        />
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center text-3xl overflow-hidden"
            style={previewUrl || formattedAvatar ? { backgroundImage: `url(${previewUrl || formattedAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            {!previewUrl && !formattedAvatar && '🤖'}
          </div>
          {selectedAvatar ? (
            <div className="flex items-center gap-3">
              <div className="text-xs text-green-500 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Click Save Changes to save</span>
              </div>
              <button 
                onClick={() => onAvatarSelect?.(null)}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                title="Cancel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => avatarInputRef.current?.click()}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-white/[0.05] hover:bg-white/[0.08] text-white'
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
              }`}
            >
              <span>+</span>
              <span>Select Image</span>
            </button>
          )}
        </div>
        <p className={`text-xs mt-2 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-600'
        }`}>
          Supported formats: SVG, JPEG, PNG (max 5MB)
        </p>
      </div>

      {/* Agent Name */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Agent Name
        </label>
        <input
          type="text"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="Agent Name"
          className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-purple-500/50 transition-all duration-200 ${
            isDarkMode
              ? 'bg-white/[0.05] border border-white/[0.1] text-white focus:bg-white/[0.08]'
              : 'bg-white border border-purple-200 text-gray-900 focus:bg-white focus:border-purple-400'
          }`}
        />
      </div>

      {/* Prompt */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Instructions (Prompt)
        </label>
        <textarea
          value={agentPrompt}
          onChange={(e) => setAgentPrompt(e.target.value)}
          placeholder="Enter agent instructions..."
          rows={6}
          className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-purple-500/50 transition-all duration-200 resize-none ${
            isDarkMode
              ? 'bg-white/[0.05] border border-white/[0.1] text-white focus:bg-white/[0.08]'
              : 'bg-white border border-purple-200 text-gray-900 focus:bg-white focus:border-purple-400'
          }`}
        />
      </div>

      {/* Save Button */}
      <button 
        onClick={onSaveSettings}
        disabled={isSaving}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600 hover:from-purple-700 hover:to-purple-800 dark:hover:from-purple-600 dark:hover:to-purple-700 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-purple-700"
      >
        {isSaving ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Saving...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Save Changes</span>
          </>
        )}
      </button>
    </div>
  );
};

