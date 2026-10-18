import useDarkModeStore from '../../../../store/darkmode.store';
import useModalsStore from '../../../../store/modals.store';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useResetMemory } from '../../pages/chat/hooks';

function ResetMemoryModal() {
  const { isDarkMode } = useDarkModeStore();
  const { resetMemoryModal, closeResetMemoryModal } = useModalsStore();
  const { resetMemory, isResetting } = useResetMemory();

  if (!resetMemoryModal.isOpen) return null;

  const handleConfirm = () => {
    if (resetMemoryModal.agentId) {
      resetMemory(resetMemoryModal.agentId);
      closeResetMemoryModal();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeResetMemoryModal}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md rounded-xl sm:rounded-2xl shadow-2xl border max-h-[95vh] overflow-y-auto ${
          isDarkMode 
            ? 'bg-[#1a1a1a] border-gray-800' 
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-4 sm:p-6">
          {/* Header with Icon */}
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3 sm:mb-4">
              <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className={`text-xl sm:text-2xl font-bold text-center ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Reset Memory
            </h2>
            <p className={`text-center mt-1.5 sm:mt-2 text-sm sm:text-base ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Are you sure you want to reset the conversation memory?
            </p>
          </div>

          {/* Warning Box */}
          <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border-2 ${
            isDarkMode 
              ? 'bg-orange-500/10 border-orange-500/30' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-start gap-2 mb-2 sm:mb-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="font-semibold text-orange-500 text-sm sm:text-base">
                This action will:
              </span>
            </div>
            <ul className={`space-y-1.5 sm:space-y-2 text-xs sm:text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Delete all conversation history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Clear all stored memories</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Remove context from previous messages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Start fresh with no conversation history</span>
              </li>
            </ul>
            <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-orange-500/30">
              <p className="text-xs sm:text-sm font-medium text-orange-500">
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={closeResetMemoryModal}
              className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
                isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isResetting}
              className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="hidden xs:inline">Resetting...</span>
                  <span className="xs:hidden">...</span>
                </>
              ) : (
                <>
                  <span className="hidden xs:inline">Reset Memory</span>
                  <span className="xs:hidden">Reset</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetMemoryModal;

