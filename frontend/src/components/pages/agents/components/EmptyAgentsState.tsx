import useDarkModeStore from '../../../../../store/darkmode.store';

function EmptyAgentsState() {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-center max-w-md">
        <div className={`text-6xl mb-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
          🤖
        </div>
        <h3 className={`text-2xl font-bold mb-3 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          No Agents Available
        </h3>
        <p className={`text-base mb-6 leading-relaxed ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          You haven't created any agents yet. Start building your first AI agent to automate tasks and enhance your workflow.
        </p>
        <a
          href="/builder"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-orange-500 hover:from-purple-500 hover:via-purple-400 hover:to-orange-400 text-white font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Your First Agent
        </a>
      </div>
    </div>
  );
}

export default EmptyAgentsState;

