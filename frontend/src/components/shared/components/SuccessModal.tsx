import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
}

export const SuccessModal = ({
  title,
  subtitle,
  children,
  isOpen,
  onClose,
}: SuccessModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex flex-col items-center justify-center pt-12 pb-8 px-6">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
              <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              {title}
            </h2>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-gray-400 text-center text-sm">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content */}
          {children && (
            <div className="px-8 pb-8">
              {children}
            </div>
          )}

          {/* Close Button (optional) */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

