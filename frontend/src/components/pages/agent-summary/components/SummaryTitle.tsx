interface SummaryTitleProps {
  isDarkMode: boolean;
}

function SummaryTitle({ isDarkMode }: SummaryTitleProps) {
  return (
    <div className="text-center px-8 pb-6">
      <h1 className={`text-4xl font-extrabold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x ${
        isDarkMode ? '' : ''
      }`}>
        🎉 Agent Created Successfully!
      </h1>
      <p className={`text-lg font-medium ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        Your AI assistant is ready to help you accomplish amazing things
      </p>
      
      {/* Decorative line */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <div className={`h-1 w-12 rounded-full bg-gradient-to-r from-transparent ${
          isDarkMode ? 'via-purple-400 to-transparent' : 'via-purple-600 to-transparent'
        }`}></div>
        <div className={`w-2 h-2 rounded-full ${
          isDarkMode ? 'bg-pink-400' : 'bg-pink-600'
        } animate-pulse`}></div>
        <div className={`h-1 w-12 rounded-full bg-gradient-to-r from-transparent ${
          isDarkMode ? 'via-pink-400 to-transparent' : 'via-pink-600 to-transparent'
        }`}></div>
      </div>
    </div>
  );
}

export default SummaryTitle;

