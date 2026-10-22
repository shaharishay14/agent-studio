import { useEffect, useId, useState } from 'react';
import { Workflow } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IconCircle } from '@/components/ui/icon-circle';
import { Modal } from '@/components/ui/modal';
import { PillInput } from '@/components/ui/pill-input';
import { TextArea } from '@/components/ui/text-area';
import useModalsStore from '../../../../../../store/modals.store';
import { useCreateWorkflow, useUpdateWorkflow } from '../../hooks';

function CreateWorkflowModal() {
  const { createWorkflowModal, closeCreateWorkflowModal } = useModalsStore();
  const { mutate: createWorkflow, isPending: isCreating } = useCreateWorkflow();
  const { mutate: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const formId = useId();

  const isEditMode = createWorkflowModal.workflowId !== null;
  const isPending = isCreating || isUpdating;

  // Load data when editing
  useEffect(() => {
    if (createWorkflowModal.workflowData) {
      setName(createWorkflowModal.workflowData.name);
      setDescription(createWorkflowModal.workflowData.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [createWorkflowModal.workflowData, createWorkflowModal.isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    if (isEditMode && createWorkflowModal.workflowId) {
      // Update existing workflow
      updateWorkflow({
        id: createWorkflowModal.workflowId,
        data: {
          name: name.trim(),
          description: description.trim(),
        }
      }, {
        onSuccess: () => {
          setName('');
          setDescription('');
          closeCreateWorkflowModal();
        },
      });
    } else {
      // Create new workflow
      createWorkflow({
        name: name.trim(),
        description: description.trim(),
        status: 'draft',
      }, {
        onSuccess: () => {
          setName('');
          setDescription('');
          closeCreateWorkflowModal();
        },
      });
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    closeCreateWorkflowModal();
  };

  return (
    <Modal
      open={createWorkflowModal.isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title={isEditMode ? 'Edit workflow' : 'New workflow'}
      description={isEditMode ? undefined : "Chain agents so each one's answer becomes the next one's message."}
      icon={
        <IconCircle>
          <Workflow />
        </IconCircle>
      }
      dismissible={!isPending}
      footer={
        <>
          <Button variant="glass" size="sm" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} size="sm" disabled={!name.trim()} loading={isPending}>
            {isPending ? (isEditMode ? 'Saving…' : 'Creating…') : isEditMode ? 'Save changes' : 'Create workflow'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PillInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Daily report"
          required
          autoFocus
        />
        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this workflow do?"
          rows={3}
          className="resize-none"
        />
      </form>
    </Modal>
  );
}

export default CreateWorkflowModal;
