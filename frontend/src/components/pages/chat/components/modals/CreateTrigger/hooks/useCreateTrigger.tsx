import { useState } from 'react';
import type {
  TriggerType,
  OutputType,
  Frequency,
  AppEventType,
  AppEvent,
  EventConfig
} from '../../../../types';
import {
  TriggerTypeSelector,
  CronScheduleConfig,
  AppEventConfig,
  CommandInput,
  OutputTypeSelector
} from '../index';

interface UseCreateTriggerProps {
  agentId?: string;
  mockAppEvents: AppEvent[];
}

export const useCreateTrigger = ({ agentId, mockAppEvents }: UseCreateTriggerProps) => {
  // State management
  const [step, setStep] = useState(1);
  const [triggerType, setTriggerType] = useState<TriggerType>(null);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [hour, setHour] = useState('11:00');
  const [minute, setMinute] = useState('00');
  const [command, setCommand] = useState('');
  const [outputType, setOutputType] = useState<OutputType>('email');
  const [email, setEmail] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [selectedAppEvent, setSelectedAppEvent] = useState<AppEventType>(null);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [eventConfig, setEventConfig] = useState<EventConfig>({
    interval: '1',
    labelIds: 'INBOX',
    query: '',
    userId: 'me'
  });

  // Navigation handlers
  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Validation logic
  const canProceed = () => {
    if (step === 1) return triggerType !== null;
    if (step === 2 && triggerType === 'cron') return true;
    if (step === 2 && triggerType === 'app_event') return selectedAppEvent !== null;
    if (step === 3) return command.trim() !== '';
    if (step === 4) {
      if (outputType === 'email') return email.trim() !== '';
      if (outputType === 'whatsapp') return whatsappPhone.trim() !== '';
    }
    return true;
  };

  // Render step content
  const renderStepContent = () => {
    if (step === 1) {
      return (
        <TriggerTypeSelector
          selectedType={triggerType}
          onSelect={setTriggerType}
        />
      );
    }

    if (step === 2) {
      if (triggerType === 'cron') {
        return (
          <CronScheduleConfig
            frequency={frequency}
            hour={hour}
            minute={minute}
            onFrequencyChange={setFrequency}
            onHourChange={setHour}
            onMinuteChange={setMinute}
          />
        );
      }

      return (
        <AppEventConfig
          mockEvents={mockAppEvents}
          selectedEvent={selectedAppEvent}
          showDropdown={showEventDropdown}
          eventConfig={eventConfig}
          onEventSelect={(eventId) => {
            setSelectedAppEvent(eventId as AppEventType);
            setShowEventDropdown(false);
          }}
          onToggleDropdown={() => setShowEventDropdown(!showEventDropdown)}
          onConfigChange={setEventConfig}
        />
      );
    }

    if (step === 3) {
      return (
        <CommandInput
          command={command}
          onCommandChange={setCommand}
        />
      );
    }

    if (step === 4) {
      return (
        <OutputTypeSelector
          outputType={outputType}
          email={email}
          whatsappPhone={whatsappPhone}
          onOutputTypeChange={setOutputType}
          onEmailChange={setEmail}
          onWhatsappPhoneChange={setWhatsappPhone}
        />
      );
    }
  };

  // Handle trigger creation
  const handleCreateTrigger = () => {
    const triggerData = {
      agentId,
      triggerType,
      frequency,
      hour,
      minute,
      command,
      outputType,
      email,
      whatsappPhone,
      selectedAppEvent,
      eventConfig
    };
    
    console.log('Create trigger:', triggerData);
    return triggerData;
  };

  return {
    // State
    step,
    
    // Handlers
    handleNext,
    handleBack,
    handleCreateTrigger,
    
    // Validation
    canProceed: canProceed(),
    
    // Render
    renderStepContent
  };
};

