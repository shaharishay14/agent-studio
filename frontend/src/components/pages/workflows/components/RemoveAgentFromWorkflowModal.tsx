import { useMemo, useEffect } from 'react';
import { Unlink } from 'lucide-react';

import { ConfirmModal } from '@/components/ui/confirm-modal';
import useModalsStore from '../../../../../store/modals.store';
import { useUpdateWorkflow } from '../hooks';
import { useGetWorkflows } from '../hooks';

function RemoveAgentFromWorkflowModal() {
  const { removeAgentFromWorkflowModal, closeRemoveAgentFromWorkflowModal } = useModalsStore();
  const { mutate: updateWorkflow, isPending } = useUpdateWorkflow();
  const { workflows } = useGetWorkflows();

  // The workflow this modal is for
  const currentWorkflow = useMemo(() => 
    workflows.find(w => w.id === removeAgentFromWorkflowModal.workflowId),
    [workflows, removeAgentFromWorkflowModal.workflowId]
  );

  // Close if the workflow no longer exists (it was deleted)
  useEffect(() => {
    if (removeAgentFromWorkflowModal.isOpen && removeAgentFromWorkflowModal.workflowId && !currentWorkflow) {
      closeRemoveAgentFromWorkflowModal();
    }
  }, [removeAgentFromWorkflowModal.isOpen, removeAgentFromWorkflowModal.workflowId, currentWorkflow, closeRemoveAgentFromWorkflowModal]);

  // IDs of the agents already in the workflow
  const existingAgents = useMemo(() => {
    if (currentWorkflow?.agents) {
      return currentWorkflow.agents.map(agent => agent.id);
    }
    return [];
  }, [currentWorkflow]);

  const handleConfirm = () => {
    if (removeAgentFromWorkflowModal.workflowId && removeAgentFromWorkflowModal.agentId) {
      // Drop only this agent from the list
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
    <ConfirmModal
      open={removeAgentFromWorkflowModal.isOpen}
      onCancel={closeRemoveAgentFromWorkflowModal}
      onConfirm={handleConfirm}
      title="Remove from this workflow?"
      icon={<Unlink />}
      confirmLabel="Remove agent"
      pendingLabel="Removing…"
      pending={isPending}
    >
      <p className="m-0">
        <strong className="font-semibold text-white">{removeAgentFromWorkflowModal.agentName}</strong> will be taken out of this
        workflow. The agent itself isn't deleted.
      </p>
    </ConfirmModal>
  );
}

export default RemoveAgentFromWorkflowModal;
