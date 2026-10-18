import { Settings as SettingsIcon } from 'lucide-react';
import useDarkModeStore from '../../../../../../../store/darkmode.store';

interface BasicInfoStepProps {
  name: string;
  setName: (name: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  avatarPreview: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function BasicInfoStep({
  name,
  setName,
  prompt,
  setPrompt,
  avatarPreview,
  onAvatarChange
}: BasicInfoStepProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <label className={`block text-xs sm:text-sm font-semibold mb-2 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>
          Agent Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your agent's name"
          className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border-2 outline-none transition-all text-sm sm:text-base ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
          }`}
        />
      </div>

      <div>
        <label className={`block text-xs sm:text-sm font-semibold mb-2 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>
          Agent Prompt <span className="text-red-500">*</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Build a comprehensive task management agent that can help organize projects, break down complex tasks, create timelines, and track dependencies. The agent should be able to suggest task prioritization strategies, create project plans, identify critical paths, and provide progress updates. It should help with assigning tasks to team members, setting realistic deadlines, and managing resources effectively."
          rows={4}
          className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border-2 outline-none transition-all resize-none text-sm sm:text-base sm:rows-6 ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
          }`}
        />
      </div>

      <div>
        <label className={`block text-xs sm:text-sm font-semibold mb-2 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>
          Avatar (Optional)
        </label>
        <p className={`text-xs mb-3 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Upload a custom avatar or we'll generate one automatically for you
        </p>
        <div className="flex items-center gap-3 sm:gap-4">
          {avatarPreview && (
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-purple-500 flex-shrink-0">
              <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
            </div>
          )}
          <label className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl border-2 border-dashed cursor-pointer transition-all text-sm sm:text-base ${
            isDarkMode
              ? 'border-gray-700 hover:border-purple-500 bg-gray-800 text-gray-300 hover:text-white'
              : 'border-gray-300 hover:border-purple-500 bg-gray-50 text-gray-700 hover:text-purple-700'
          }`}>
            <span className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Choose Avatar</span>
              <span className="sm:hidden">Choose</span>
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default BasicInfoStep;

