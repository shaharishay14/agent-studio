import { CalendarClock, Zap } from 'lucide-react';

import { ChoiceCard } from '@/components/ui/choice-card';
import StepHeading from './StepHeading';

type TriggerType = 'cron' | 'app_event' | null;

interface TriggerTypeSelectorProps {
  selectedType: TriggerType;
  onSelect: (type: TriggerType) => void;
}

function TriggerTypeSelector({ selectedType, onSelect }: TriggerTypeSelectorProps) {
  return (
    <div>
      <StepHeading title="What starts it?" subtitle="Run the agent on a schedule, or when something happens in an app." />
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard
          icon={<CalendarClock />}
          title="On a schedule"
          description="Every day, week or month at a set time"
          selected={selectedType === 'cron'}
          onClick={() => onSelect('cron')}
        />
        <ChoiceCard
          icon={<Zap />}
          title="When something happens"
          description="A new email, commit, message or event"
          selected={selectedType === 'app_event'}
          onClick={() => onSelect('app_event')}
        />
      </div>
    </div>
  );
}

export default TriggerTypeSelector;
