interface DragHintProps {
  isDarkMode: boolean;
}

export const DragHint = ({ isDarkMode }: DragHintProps) => {
  return (
    <div className="absolute -top-28 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
      {/* Text hint with fade in */}
      <div className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap animate-pulse ${
        isDarkMode 
          ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border border-purple-400/50 shadow-lg shadow-purple-500/20' 
          : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-300 shadow-xl'
      }`}>
        ⬇️ Drag me ⬇️
      </div>
      
      {/* Multiple arrows pointing down with staggered animation */}
      <div className="flex flex-col items-center mt-2 space-y-[-8px]">
        <svg 
          className={`w-7 h-7 animate-bounce ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
          fill="currentColor" 
          viewBox="0 0 24 24"
          style={{ animationDelay: '0s', animationDuration: '1s' }}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
        <svg 
          className={`w-7 h-7 animate-bounce ${isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}`}
          fill="currentColor" 
          viewBox="0 0 24 24"
          style={{ animationDelay: '0.1s', animationDuration: '1s' }}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
        <svg 
          className={`w-7 h-7 animate-bounce ${isDarkMode ? 'text-purple-400/40' : 'text-purple-600/40'}`}
          fill="currentColor" 
          viewBox="0 0 24 24"
          style={{ animationDelay: '0.2s', animationDuration: '1s' }}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>
      
      {/* Pulsing circle around the button */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-24 h-24">
        <div className={`absolute inset-0 rounded-full animate-ping ${
          isDarkMode ? 'bg-purple-500/20' : 'bg-purple-400/30'
        }`} style={{ animationDuration: '2s' }} />
        <div className={`absolute inset-0 rounded-full animate-ping ${
          isDarkMode ? 'bg-purple-500/30' : 'bg-purple-400/40'
        }`} style={{ animationDuration: '2s', animationDelay: '1s' }} />
      </div>
    </div>
  );
};

