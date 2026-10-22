import { RotateCcw } from 'lucide-react';

import { ConfirmModal } from '@/components/ui/confirm-modal';
import useModalsStore from '../../../../store/modals.store';
import { useResetMemory } from '../../pages/chat/hooks';

function ResetMemoryModal() {
  const { resetMemoryModal, closeResetMemoryModal } = useModalsStore();
  const { resetMemory, isResetting } = useResetMemory();

  const handleConfirm = () => {
    if (resetMemoryModal.agentId) {
      resetMemory(resetMemoryModal.agentId);
      closeResetMemoryModal();
    }
  };

  return (
    <ConfirmModal
      open={resetMemoryModal.isOpen}
      onCancel={closeResetMemoryModal}
      onConfirm={handleConfirm}
      title="Reset this agent's memory?"
      icon={<RotateCcw />}
      confirmLabel="Reset memory"
      pendingLabel="Resetting…"
      pending={isResetting}
    >
      <p className="m-0 mb-2">The agent starts fresh. This will:</p>
      <ul className="m-0 mb-3 flex list-disc flex-col gap-1 ps-5">
        <li>Delete the conversation history</li>
        <li>Clear everything it has remembered</li>
        <li>Drop the context from earlier messages</li>
      </ul>
      <p className="m-0 text-sm text-off">This can't be undone.</p>
    </ConfirmModal>
  );
}

export default ResetMemoryModal;
