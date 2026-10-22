import { FileX } from 'lucide-react';

import { ConfirmModal } from '@/components/ui/confirm-modal';

interface DeleteFileModalProps {
  isOpen: boolean;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

function DeleteFileModal({ isOpen, fileName, onConfirm, onCancel, isDeleting = false }: DeleteFileModalProps) {
  return (
    <ConfirmModal
      open={isOpen}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Delete this file?"
      icon={<FileX />}
      confirmLabel="Delete file"
      pendingLabel="Deleting…"
      pending={isDeleting}
    >
      <p className="m-0">
        <strong className="font-semibold break-all text-white">{fileName}</strong> will be removed, and the agent won't be able to use it
        anymore. This can't be undone.
      </p>
    </ConfirmModal>
  );
}

export default DeleteFileModal;
