interface ModalFooterProps {
  step: number;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  onCreateTrigger: () => void;
}

function ModalFooter({ 
  step, 
  canProceed, 
  onBack, 
  onNext, 
  onClose, 
  onCreateTrigger 
}: ModalFooterProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t-2 border-gray-800">
      <button
        onClick={onBack}
        disabled={step === 1}
        className="px-6 py-3 text-gray-400 hover:text-white font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="px-7 py-3 rounded-xl font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 transition-all"
        >
          Cancel
        </button>
        {step < 4 ? (
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="px-7 py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 flex items-center gap-2"
          >
            Next
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onCreateTrigger}
            disabled={!canProceed}
            className="px-7 py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Trigger
          </button>
        )}
      </div>
    </div>
  );
}

export default ModalFooter;

