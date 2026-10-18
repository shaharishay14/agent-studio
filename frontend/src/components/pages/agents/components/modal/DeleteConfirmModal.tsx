import useDarkModeStore from '../../../../../../store/darkmode.store';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  agentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

function DeleteConfirmModal({ 
  isOpen, 
  agentName, 
  onConfirm, 
  onCancel,
  isDeleting = false 
}: DeleteConfirmModalProps) {
  const { isDarkMode } = useDarkModeStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-2xl p-8 shadow-2xl ${
        isDarkMode
          ? 'bg-gray-900 border-2 border-purple-500/30'
          : 'bg-white border-2 border-purple-200'
      }`}
      style={{
        boxShadow: isDarkMode 
          ? '0 0 60px rgba(168, 85, 247, 0.4)' 
          : '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-white/10'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
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
          <h2 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Confirm Deletion
          </h2>
          <p className={`text-base leading-relaxed ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Are you sure you want to delete the agent{' '}
            <span className="font-semibold">"{agentName}"</span>? This action cannot be undone.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              isDarkMode
                ? 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin">⏳</span>
                Deleting...
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
                Delete Agent
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;

