import useDarkModeStore from '../../../../../store/darkmode.store';
import useModalsStore from '../../../../../store/modals.store';
import { useDeleteWorkflow } from '../hooks';

function DeleteWorkflowModal() {
  const { isDarkMode } = useDarkModeStore();
  const { 
    deleteWorkflowModal, 
    closeDeleteWorkflowModal,
    closeAddAgentToWorkflowModal,
    closeRemoveAgentFromWorkflowModal
  } = useModalsStore();
  const { mutate: deleteWorkflow, isPending } = useDeleteWorkflow();

  if (!deleteWorkflowModal.isOpen) return null;

  const handleConfirm = () => {
    if (deleteWorkflowModal.workflowId) {
      deleteWorkflow(deleteWorkflowModal.workflowId, {
        onSuccess: () => {
          // סגור את כל ה-modals הקשורים ל-workflow שנמחק
          closeDeleteWorkflowModal();
          closeAddAgentToWorkflowModal();
          closeRemoveAgentFromWorkflowModal();
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeDeleteWorkflowModal}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-2xl p-8 shadow-2xl ${
        isDarkMode
          ? 'bg-gray-900 border-2 border-red-500/30'
          : 'bg-white border-2 border-red-200'
      }`}
      style={{
        boxShadow: isDarkMode 
          ? '0 0 60px rgba(239, 68, 68, 0.4)' 
          : '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}
      >
        {/* Close button */}
        <button
          onClick={closeDeleteWorkflowModal}
          disabled={isPending}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-white/10'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="mb-6">
          {/* Icon and Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Delete Workflow
            </h2>
          </div>
          
          <p className={`text-base leading-relaxed ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-red-600 dark:text-red-400">"{deleteWorkflowModal.workflowName}"</span>? This action cannot be undone and will permanently remove the workflow and all its associated data.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={closeDeleteWorkflowModal}
            disabled={isPending}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              isDarkMode
                ? 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                מוחק...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteWorkflowModal;

