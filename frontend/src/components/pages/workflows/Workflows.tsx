import { WorkflowSidebar, WorkflowEmptyState, WorkflowBuilder, CreateWorkflowModal, DeleteWorkflowModal, AddAgentToWorkflowModal, RemoveAgentFromWorkflowModal, WorkflowSidebarToggleButton, LayoutWorkflow } from './components';
import { useActionsWorkflow } from './hooks';
import useDarkModeStore from '../../../../store/darkmode.store';
import useModalsStore from '../../../../store/modals.store';
import { LoadingState, ErrorState } from '../../shared/components';
import CreateTriggerModal from '../chat/components/modals/CreateTriggerModal';

function Workflows() {
  const { isDarkMode } = useDarkModeStore();
  const { createTriggerModal, closeCreateTriggerModal } = useModalsStore();
  const {
    workflows,
    isLoading,
    isError,
    error,
    refetch,
    selectedWorkflowId,
    isSidebarOpen,
    setIsSidebarOpen,
    handleCreateWorkflow,
    handleEditWorkflow,
    handleDeleteWorkflow,
    handleSelectWorkflow,
    handleCloseSidebar,
  } = useActionsWorkflow();

  // Loading state
  if (isLoading) {
    return (
      <LayoutWorkflow isDarkMode={isDarkMode}>
        <LoadingState message="Loading workflows..." />
      </LayoutWorkflow>
    );
  }

  // Error state
  if (isError) {
    return (
      <LayoutWorkflow isDarkMode={isDarkMode}>
        <ErrorState 
          message={error?.message || 'Error loading workflows'}
          onRetry={() => refetch()}
        />
      </LayoutWorkflow>
    );
  }

  return (
    <>
      <CreateWorkflowModal />
      <DeleteWorkflowModal />
      <AddAgentToWorkflowModal />
      <RemoveAgentFromWorkflowModal />
      
      {/* CreateTriggerModal for Workflows */}
      <CreateTriggerModal
        isOpen={createTriggerModal.isOpen && createTriggerModal.workflowId !== null}
        onClose={closeCreateTriggerModal}
        agentId={createTriggerModal.workflowId?.toString() || ''}
      />
      
      <LayoutWorkflow isDarkMode={isDarkMode}>
        <WorkflowSidebar
          workflows={workflows}
          selectedWorkflowId={selectedWorkflowId}
          onSelectWorkflow={handleSelectWorkflow}
          onCreateWorkflow={handleCreateWorkflow}
          onEditWorkflow={handleEditWorkflow}
          onDeleteWorkflow={handleDeleteWorkflow}
          onClose={handleCloseSidebar}
          isOpen={isSidebarOpen}
        />
        
        <div className={`flex-1 flex flex-col relative ${isSidebarOpen ? 'hidden md:flex' : 'flex'}`}>
          {!isSidebarOpen && (
            <WorkflowSidebarToggleButton 
              isDarkMode={isDarkMode}
              onToggle={() => setIsSidebarOpen(true)}
            />
          )}
          
          {selectedWorkflowId ? (
            <WorkflowBuilder workflowId={selectedWorkflowId} />
          ) : (
            <WorkflowEmptyState onCreateWorkflow={handleCreateWorkflow} />
          )}
        </div>
      </LayoutWorkflow>
    </>
  );
}

export default Workflows;

