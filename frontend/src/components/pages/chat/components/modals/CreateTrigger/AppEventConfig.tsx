import type { ReactNode } from 'react';
import { CalendarPlus, GitCommitHorizontal, Info, Mail, MessageSquare } from 'lucide-react';

import { ChoiceCard } from '@/components/ui/choice-card';
import { PillInput } from '@/components/ui/pill-input';
import { TextArea } from '@/components/ui/text-area';
import StepHeading from './StepHeading';

interface AppEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
}

interface EventConfig {
  interval: string;
  labelIds: string;
  query: string;
  userId: string;
}

interface AppEventConfigProps {
  mockEvents: AppEvent[];
  selectedEvent: string | null;
  eventConfig: EventConfig;
  onEventSelect: (eventId: string) => void;
  onConfigChange: (config: EventConfig) => void;
}

const EVENT_ICONS: Record<string, ReactNode> = {
  new_email: <Mail />,
  new_commit: <GitCommitHorizontal />,
  new_message: <MessageSquare />,
  new_event: <CalendarPlus />,
};

function AppEventConfig({ mockEvents, selectedEvent, eventConfig, onEventSelect, onConfigChange }: AppEventConfigProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <StepHeading title="Which event?" subtitle="The agent runs each time this happens." />
        <div className="grid gap-3 sm:grid-cols-2">
          {mockEvents.map((event) => (
            <ChoiceCard
              key={event.id}
              icon={EVENT_ICONS[event.id] ?? <Info />}
              title={event.name}
              description={event.description}
              selected={selectedEvent === event.id}
              onClick={() => onEventSelect(event.id)}
            />
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div className="flex animate-sky-in flex-col gap-4 rounded-inner border border-white/12 bg-night/40 p-4">
          <h4 className="m-0 text-[15px] font-semibold text-white">Settings</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <PillInput
              label="Interval"
              value={eventConfig.interval}
              onChange={(e) => onConfigChange({ ...eventConfig, interval: e.target.value })}
              placeholder="1"
              inputMode="numeric"
              helper="Default: 1"
            />
            <PillInput
              label="Label IDs"
              value={eventConfig.labelIds}
              onChange={(e) => onConfigChange({ ...eventConfig, labelIds: e.target.value })}
              placeholder="INBOX"
              helper="e.g. INBOX, UNREAD, STARRED"
            />
          </div>
          <TextArea
            label="Search query"
            value={eventConfig.query}
            onChange={(e) => onConfigChange({ ...eventConfig, query: e.target.value })}
            rows={3}
            placeholder="Same syntax as the Gmail search box, e.g. from:billing@acme.com"
            helper="Use AND to combine conditions."
            className="resize-none"
          />
          <PillInput
            label="User ID"
            value={eventConfig.userId}
            onChange={(e) => onConfigChange({ ...eventConfig, userId: e.target.value })}
            placeholder="me"
            helper='Default: "me"'
          />
          <p className="m-0 flex items-start gap-2.5 text-[13px] leading-5 text-white/66">
            <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
            The event's details are added to the agent's message when it runs, so you can refer to them in the next step.
          </p>
        </div>
      )}
    </div>
  );
}

export default AppEventConfig;
