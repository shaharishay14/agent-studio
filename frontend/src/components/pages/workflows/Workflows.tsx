import { PanelLeftOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { WorkflowSidebar, WorkflowEmptyState, WorkflowBuilder, CreateWorkflowModal, DeleteWorkflowModal, AddAgentToWorkflowModal, RemoveAgentFromWorkflowModal } from './components';
import { useActionsWorkflow } from './hooks';
import useModalsStore from '../../../../store/modals.store';
import CreateTriggerModal from '../chat/components/modals/CreateTriggerModal';

// Height under the 61px app top bar
const fullHeight = 'h-[calc(100dvh-61px)]';

function Workflows() {
  const { createTriggerModal, closeCreateTriggerModal } = useModalsStore();
  const {
    workflows,
    isLoading,
    isError,
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

  if (isLoading) {
    return (
      <div className={`grid ${fullHeight} place-items-center bg-night`}>
        <Spinner label="Loading workflows" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`flex ${fullHeight} flex-col items-center justify-center gap-4 bg-night p-8 text-center`} role="alert">
        <p className="m-0 text-white/72">We couldn't load your workflows.</p>
        <Button variant="glass" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
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

      <div className={`relative flex ${fullHeight} bg-night`}>
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

        <main className="relative min-w-0 flex-1">
          {selectedWorkflowId ? (
            <WorkflowBuilder workflowId={selectedWorkflowId} />
          ) : (
            <WorkflowEmptyState onCreateWorkflow={handleCreateWorkflow} />
          )}

          {!isSidebarOpen && (
            <Button variant="glass" size="sm" className="absolute bottom-4 left-4 z-20" onClick={() => setIsSidebarOpen(true)}>
              <PanelLeftOpen />
              Workflows
            </Button>
          )}
        </main>
      </div>
    </>
  );
}

export default Workflows;
