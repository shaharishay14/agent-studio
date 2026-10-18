import useDarkModeStore from '../../../../../store/darkmode.store';

interface IntegrationHeaderProps {
  totalAvailable: number;
  totalConnected: number;
}

function IntegrationHeader({ totalAvailable, totalConnected }: IntegrationHeaderProps) {
  const { isDarkMode } = useDarkModeStore();
  
  return (
    <div className="mb-6">
      <h1 className={`text-3xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
        isDarkMode
          ? 'from-white to-gray-400'
          : 'from-purple-600 to-pink-600'
      }`}>
        Integrations
      </h1>
      <p className={`text-base mb-4 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-700'
      }`}>
        Connect your tools to unlock powerful automations.
      </p>
      <div className="flex gap-2">
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${
          isDarkMode
            ? 'bg-white/10 text-white'
            : 'bg-purple-100 text-purple-700 border border-purple-300'
        }`}>
          {totalAvailable} available
        </span>
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
          isDarkMode
            ? 'bg-green-500/20 text-green-400'
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {totalConnected} connected
        </span>
      </div>
    </div>
  );
}

export default IntegrationHeader;

