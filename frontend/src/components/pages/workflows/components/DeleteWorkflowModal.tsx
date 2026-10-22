import { Trash2 } from 'lucide-react';

import { ConfirmModal } from '@/components/ui/confirm-modal';
import useModalsStore from '../../../../../store/modals.store';
import { useDeleteWorkflow } from '../hooks';

function DeleteWorkflowModal() {
  const { deleteWorkflowModal, closeDeleteWorkflowModal, closeAddAgentToWorkflowModal, closeRemoveAgentFromWorkflowModal } =
    useModalsStore();
  const { mutate: deleteWorkflow, isPending } = useDeleteWorkflow();

  const handleConfirm = () => {
    if (deleteWorkflowModal.workflowId) {
      deleteWorkflow(deleteWorkflowModal.workflowId, {
        onSuccess: () => {
          // Close every modal tied to the deleted workflow
          closeDeleteWorkflowModal();
          closeAddAgentToWorkflowModal();
          closeRemoveAgentFromWorkflowModal();
        },
      });
    }
  };

  return (
    <ConfirmModal
      open={deleteWorkflowModal.isOpen}
      onCancel={closeDeleteWorkflowModal}
      onConfirm={handleConfirm}
      title="Delete this workflow?"
      icon={<Trash2 />}
      confirmLabel="Delete workflow"
      pendingLabel="Deleting…"
      pending={isPending}
    >
      <p className="m-0">
        <strong className="font-semibold text-white">{deleteWorkflowModal.workflowName}</strong> and its steps will be deleted. The
        agents in it stay. This can't be undone.
      </p>
    </ConfirmModal>
  );
}

export default DeleteWorkflowModal;
