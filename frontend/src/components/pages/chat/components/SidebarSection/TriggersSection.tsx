import { CalendarClock, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface TriggersSectionProps {
  onCreateTrigger?: () => void;
}

export const TriggersSection = ({ onCreateTrigger }: TriggersSectionProps) => {
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-white/72">Run this agent on a schedule, or when something happens in a connected app.</p>

      <Button block size="sm" onClick={onCreateTrigger}>
        <Plus />
        Create trigger
      </Button>

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center">
        <CalendarClock className="size-5 text-white/60" strokeWidth={1.7} aria-hidden="true" />
        <p className="m-0 text-sm font-medium">No triggers yet</p>
        <p className="m-0 text-[13px] text-white/60">Create one to have the agent run on its own.</p>
      </div>
    </div>
  );
};
