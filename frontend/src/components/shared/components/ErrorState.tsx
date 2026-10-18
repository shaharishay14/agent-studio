import useDarkModeStore from '../../../../store/darkmode.store';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

function ErrorState({ message = 'An error occurred', onRetry }: ErrorStateProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-center">
        <div className={`text-4xl mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          ❌
        </div>
        <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              isDarkMode
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            נסה שוב
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;

