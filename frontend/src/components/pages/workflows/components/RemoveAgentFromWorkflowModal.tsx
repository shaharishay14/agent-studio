import { useMemo, useEffect } from 'react';
import useDarkModeStore from '../../../../../store/darkmode.store';
import useModalsStore from '../../../../../store/modals.store';
import { useUpdateWorkflow } from '../hooks';
import { useGetWorkflows } from '../hooks';

function RemoveAgentFromWorkflowModal() {
  const { isDarkMode } = useDarkModeStore();
  const { removeAgentFromWorkflowModal, closeRemoveAgentFromWorkflowModal } = useModalsStore();
  const { mutate: updateWorkflow, isPending } = useUpdateWorkflow();
  const { workflows } = useGetWorkflows();

  // מצא את ה-workflow הנוכחי
  const currentWorkflow = useMemo(() => 
    workflows.find(w => w.id === removeAgentFromWorkflowModal.workflowId),
    [workflows, removeAgentFromWorkflowModal.workflowId]
  );

  // אם ה-workflow לא קיים יותר (נמחק), סגור את ה-modal
  useEffect(() => {
    if (removeAgentFromWorkflowModal.isOpen && removeAgentFromWorkflowModal.workflowId && !currentWorkflow) {
      closeRemoveAgentFromWorkflowModal();
    }
  }, [removeAgentFromWorkflowModal.isOpen, removeAgentFromWorkflowModal.workflowId, currentWorkflow, closeRemoveAgentFromWorkflowModal]);

  // קבל את ה-agents הקיימים מה-workflow (רק IDs)
  const existingAgents = useMemo(() => {
    if (currentWorkflow?.agents) {
      return currentWorkflow.agents.map(agent => agent.id);
    }
    return [];
  }, [currentWorkflow]);

  if (!removeAgentFromWorkflowModal.isOpen) return null;

  const handleConfirm = () => {
    if (removeAgentFromWorkflowModal.workflowId && removeAgentFromWorkflowModal.agentId) {
      // הסר רק את ה-agent הספציפי מה-agents array
      const agentIdToRemove = removeAgentFromWorkflowModal.agentId;
      const updatedAgents = existingAgents.filter(
        (id: string) => id !== agentIdToRemove
      );
      
      updateWorkflow({
        id: removeAgentFromWorkflowModal.workflowId,
        data: { agents: updatedAgents }
      }, {
        onSuccess: () => {
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
        onClick={closeRemoveAgentFromWorkflowModal}
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
          onClick={closeRemoveAgentFromWorkflowModal}
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
              Remove Agent
            </h2>
          </div>
          
          <p className={`text-base leading-relaxed ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Are you sure you want to remove{' '}
            <span className="font-semibold text-red-600 dark:text-red-400">"{removeAgentFromWorkflowModal.agentName}"</span> from this workflow? This will only remove the agent from the workflow, not delete the agent itself.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={closeRemoveAgentFromWorkflowModal}
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
                מסיר...
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Remove
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RemoveAgentFromWorkflowModal;

