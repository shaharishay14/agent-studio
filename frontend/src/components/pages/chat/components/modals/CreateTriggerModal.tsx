import { ArrowLeft, ArrowRight, CalendarClock, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IconCircle } from '@/components/ui/icon-circle';
import { Modal } from '@/components/ui/modal';
import { WizardSteps } from '@/components/ui/wizard-steps';
import { useCreateTrigger } from './CreateTrigger';
import type { CreateTriggerModalProps, AppEvent } from '../../types';

const mockAppEvents: AppEvent[] = [
  { id: 'new_email', name: 'New email', description: 'A new email arrives', icon: 'mail', connected: false },
  { id: 'new_commit', name: 'New commit', description: 'A commit is pushed', icon: 'commit', connected: false },
  { id: 'new_message', name: 'New message', description: 'A message is posted', icon: 'message', connected: false },
  { id: 'new_event', name: 'New calendar event', description: 'An event is created', icon: 'calendar', connected: false },
];

const STEPS = ['Trigger', 'Timing', 'Message', 'Results'];

function CreateTriggerModal({ isOpen, onClose, agentId }: CreateTriggerModalProps) {
  const { step, handleNext, handleBack, handleCreateTrigger, canProceed, renderStepContent } = useCreateTrigger({ agentId, mockAppEvents });

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="New trigger"
      description="Run this agent automatically."
      icon={
        <IconCircle>
          <CalendarClock />
        </IconCircle>
      }
      size="lg"
      footer={
        <>
          {step > 1 && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="mr-auto">
              <ArrowLeft />
              Back
            </Button>
          )}
          {/* On phones, Back + the close button cover it once past the first step */}
          <Button variant="glass" size="sm" onClick={onClose} className={step > 1 ? 'hidden sm:inline-flex' : undefined}>
            Cancel
          </Button>
          {step < 4 ? (
            <Button size="sm" onClick={handleNext} disabled={!canProceed}>
              Next
              <ArrowRight />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!canProceed}
              onClick={() => {
                handleCreateTrigger();
                onClose();
              }}
            >
              <Plus />
              Create trigger
            </Button>
          )}
        </>
      }
    >
      <WizardSteps steps={STEPS} current={step - 1} className="mb-6" />
      <div key={step} className="animate-sky-in">
        {renderStepContent()}
      </div>
    </Modal>
  );
}

export default CreateTriggerModal;
