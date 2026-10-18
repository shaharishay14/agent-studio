import useDarkModeStore from '../../../../../../store/darkmode.store';
import {
  StepIndicator,
  ModalHeader,
  ModalFooter,
  useCreateTrigger
} from './CreateTrigger';
import type {
  CreateTriggerModalProps,
  AppEvent,
  Step
} from '../../types';

const mockAppEvents: AppEvent[] = [
  { id: 'new_email', name: 'New Email', description: 'Triggered when a new email arrives', icon: '📧', connected: false },
  { id: 'new_commit', name: 'New Commit', description: 'Triggered when a new commit is pushed', icon: '💾', connected: false },
  { id: 'new_message', name: 'New Message', description: 'Triggered when a new message is posted', icon: '💬', connected: false },
  { id: 'new_event', name: 'New Event', description: 'Triggered when a new event occurs', icon: '📅', connected: false },
];

const steps: Step[] = [
  { num: 1, title: 'Trigger Type', subtitle: 'Choose how this trigger starts' },
  { num: 2, title: 'Schedule or Config', subtitle: 'Define timing or event settings' },
  { num: 3, title: 'Message & Test', subtitle: 'Craft the instruction and test it' },
  { num: 4, title: 'Output', subtitle: 'Decide where results are sent' },
];

function CreateTriggerModal({ isOpen, onClose, agentId }: CreateTriggerModalProps) {
  const { isDarkMode } = useDarkModeStore();
  
  const {
    step,
    handleNext,
    handleBack,
    handleCreateTrigger,
    canProceed,
    renderStepContent
  } = useCreateTrigger({ agentId, mockAppEvents });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-4xl rounded-3xl shadow-2xl custom-scrollbar border-2 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-700/50' 
            : 'bg-white border-gray-200'
        }`}
        style={{
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div className="p-10">
          {/* Header */}
          <ModalHeader onClose={onClose} />

          {/* Step Indicator */}
          <StepIndicator currentStep={step} steps={steps} />

          {/* Content */}
          <div className="min-h-[350px] mb-10 bg-gray-800/20 rounded-2xl p-8 border border-gray-800/50">
            {renderStepContent()}
          </div>

          {/* Footer Buttons */}
          <ModalFooter
            step={step}
            canProceed={canProceed}
            onBack={handleBack}
            onNext={handleNext}
            onClose={onClose}
            onCreateTrigger={() => {
              handleCreateTrigger();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CreateTriggerModal;

