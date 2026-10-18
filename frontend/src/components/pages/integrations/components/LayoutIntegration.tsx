import { type ReactNode } from 'react';

interface LayoutIntegrationProps {
  children: ReactNode;
  isDarkMode: boolean;
}

function LayoutIntegration({ children, isDarkMode }: LayoutIntegrationProps) {
  return (
    <div className={`min-h-screen p-8 relative overflow-hidden ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950'
        : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100'
    }`}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl ${
          isDarkMode
            ? 'bg-purple-500/10'
            : 'bg-purple-300/50'
        }`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl ${
          isDarkMode
            ? 'bg-pink-500/10'
            : 'bg-pink-300/50'
        }`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl ${
          isDarkMode
            ? 'bg-purple-500/5'
            : 'bg-indigo-200/40'
        }`} />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default LayoutIntegration;

