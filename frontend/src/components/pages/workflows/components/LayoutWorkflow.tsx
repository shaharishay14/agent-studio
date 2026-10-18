import { type ReactNode } from 'react';

interface LayoutWorkflowProps {
  children: ReactNode;
  isDarkMode: boolean;
}

function LayoutWorkflow({ children, isDarkMode }: LayoutWorkflowProps) {
  return (
    <div className={`relative h-[calc(100vh-4rem)] overflow-hidden ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950'
        : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100'
    }`}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-10 left-10 w-64 h-64 rounded-full blur-3xl ${
          isDarkMode ? 'bg-purple-500/10' : 'bg-purple-300/50'
        }`} />
        <div className={`absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl ${
          isDarkMode ? 'bg-pink-500/10' : 'bg-pink-300/50'
        }`} />
        <div className={`absolute top-1/2 right-1/4 w-96 h-96 rounded-full blur-3xl ${
          isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-200/40'
        }`} />
      </div>

      <div className="relative z-10 flex h-full">
        {children}
      </div>
    </div>
  );
}

export default LayoutWorkflow;

