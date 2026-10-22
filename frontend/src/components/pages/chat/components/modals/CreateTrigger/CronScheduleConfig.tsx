import { Clock } from 'lucide-react';

import { SelectField } from '@/components/ui/select-field';
import StepHeading from './StepHeading';

type Frequency = 'daily' | 'weekly' | 'monthly';

interface CronScheduleConfigProps {
  frequency: Frequency;
  hour: string;
  minute: string;
  onFrequencyChange: (frequency: Frequency) => void;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
}

const FREQUENCY_LABEL: Record<Frequency, string> = { daily: 'Every day', weekly: 'Every week', monthly: 'Every month' };

function CronScheduleConfig({ frequency, hour, minute, onFrequencyChange, onHourChange, onMinuteChange }: CronScheduleConfigProps) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeading title="When should it run?" subtitle="Times are in your local time zone." />

      <SelectField label="How often" value={frequency} onChange={(e) => onFrequencyChange(e.target.value as Frequency)}>
        <option value="daily">Every day</option>
        <option value="weekly">Once a week</option>
        <option value="monthly">Once a month</option>
      </SelectField>

      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Hour" value={hour} onChange={(e) => onHourChange(e.target.value)}>
          {Array.from({ length: 24 }, (_, i) => {
            const h = i.toString().padStart(2, '0');
            return (
              <option key={h} value={`${h}:00`}>
                {h}
              </option>
            );
          })}
        </SelectField>
        <SelectField label="Minute" value={minute} onChange={(e) => onMinuteChange(e.target.value)}>
          {['00', '15', '30', '45'].map((m) => (
            <option key={m} value={m}>
              :{m}
            </option>
          ))}
        </SelectField>
      </div>

      <p className="m-0 flex items-center gap-2.5 rounded-2xl border border-white/12 bg-night/50 px-4 py-3 text-sm text-white/80" aria-live="polite">
        <Clock className="size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
        <span>
          Runs <strong className="font-semibold text-white">{FREQUENCY_LABEL[frequency].toLowerCase()}</strong> at{' '}
          <strong className="font-semibold text-white">
            {hour.split(':')[0]}:{minute}
          </strong>
        </span>
      </p>
    </div>
  );
}

export default CronScheduleConfig;
