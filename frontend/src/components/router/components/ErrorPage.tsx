import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Home, RefreshCw, Coffee, Frown } from 'lucide-react';

export default function ErrorPage() {
  const error = useRouteError();

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const getErrorMessage = () => {
    if (isRouteErrorResponse(error)) {
      return error.statusText || error.data?.message || 'An unexpected error occurred';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  };

  const getErrorStatus = () => {
    if (isRouteErrorResponse(error)) {
      return error.status;
    }
    return null;
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Animated Error Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="text-9xl animate-bounce">
                😵
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <Coffee className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Error Status - Big and Bold */}
          {getErrorStatus() && (
            <div className="relative">
              <h1 className="text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 leading-none select-none">
                {getErrorStatus()}
              </h1>
              <div className="absolute inset-0 text-[12rem] font-black text-purple-600/10 dark:text-purple-400/10 blur-2xl leading-none select-none">
                {getErrorStatus()}
              </div>
            </div>
          )}

          {/* Main Message */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">
              Oops! Something broke
            </h2>
            <p className="text-xl md:text-2xl text-purple-600 dark:text-purple-400 font-medium italic flex items-center justify-center gap-2">
              <Frown className="w-6 h-6" />
              It happens to the best of us!
            </p>
            <div className="max-w-md mx-auto">
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {getErrorMessage()}
              </p>
            </div>
          </div>

          {/* Fun Message */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800 shadow-xl">
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Don't worry, even the best code has bad days. <br />
              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                Let's try to fix this together!
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
            <button
              onClick={handleGoHome}
              className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <span className="relative flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Take Me Home
              </span>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="group relative w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95 border-2 border-purple-200 dark:border-purple-700"
            >
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Give It Another Shot
              </span>
            </button>
          </div>

          {/* Support Note */}
          <div className="pt-6">
            <p className="text-gray-600 dark:text-gray-400">
              Still stuck? No worries! Reach out to our{' '}
              <a 
                href={`mailto:${import.meta.env.VITE_MAIL_SUPPORT_TEAM}`}
                className="font-bold text-purple-600 dark:text-purple-400 hover:text-pink-600 dark:hover:text-pink-400 underline decoration-2 underline-offset-4 transition-colors inline-flex items-center gap-1"
              >
                awesome support team
              </a>
              {' '}and we'll help you out! 🚀
            </p>
          </div>

          {/* Developer Info (only in dev mode) */}
          {import.meta.env.DEV && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium">
                🔧 Technical Details (Dev Mode)
              </summary>
              <pre className="mt-4 p-4 bg-gray-900 dark:bg-black rounded-lg text-green-400 text-xs overflow-auto max-h-60 border border-gray-700">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

