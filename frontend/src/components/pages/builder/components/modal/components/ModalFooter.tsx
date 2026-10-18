import { ArrowLeft, ArrowRight } from 'lucide-react';
import useDarkModeStore from '../../../../../../../store/darkmode.store';

interface ModalFooterProps {
  currentStep: number;
  canProceed: boolean;
  isCreating: boolean;
  isStep1Valid: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

function ModalFooter({
  currentStep,
  canProceed,
  isCreating,
  isStep1Valid,
  onBack,
  onNext,
  onSubmit
}: ModalFooterProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className={`px-4 sm:px-8 py-4 sm:py-6 border-t flex items-center justify-between flex-shrink-0 gap-2 sm:gap-4 ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <button
        onClick={onBack}
        disabled={currentStep === 1}
        className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
          currentStep === 1
            ? 'opacity-50 cursor-not-allowed'
            : isDarkMode
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {currentStep < 4 ? (
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`flex items-center gap-1 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            !canProceed
              ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
              : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={isCreating || !isStep1Valid}
          className={`flex items-center gap-1 sm:gap-2 px-4 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
            isCreating || !isStep1Valid
              ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
              : 'bg-gradient-to-r from-purple-600 via-purple-500 to-orange-500 hover:from-purple-500 hover:via-purple-400 hover:to-orange-400 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {isCreating ? (
            <>
              <span className="animate-spin">⏳</span>
              <span className="hidden sm:inline">Creating...</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Create Agent</span>
              <span className="sm:hidden">Create</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default ModalFooter;

