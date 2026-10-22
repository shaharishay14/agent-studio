import { Trash2 } from 'lucide-react';

import { ConfirmModal } from '@/components/ui/confirm-modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  agentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

function DeleteConfirmModal({ isOpen, agentName, onConfirm, onCancel, isDeleting = false }: DeleteConfirmModalProps) {
  return (
    <ConfirmModal
      open={isOpen}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Delete this agent?"
      icon={<Trash2 />}
      confirmLabel="Delete agent"
      pendingLabel="Deleting…"
      pending={isDeleting}
    >
      <p className="m-0">
        <strong className="font-semibold text-white">{agentName}</strong> and its conversations will be deleted. This can't be undone.
      </p>
    </ConfirmModal>
  );
}

export default DeleteConfirmModal;
