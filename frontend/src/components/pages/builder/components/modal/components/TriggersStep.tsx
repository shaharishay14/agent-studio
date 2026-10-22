import { CalendarClock } from 'lucide-react';

// Triggers need an agent to exist first, so this step points to where they're added
function TriggersStep() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="grid size-14 place-items-center rounded-pill border border-white/30 bg-white/8" aria-hidden="true">
        <CalendarClock className="size-6" strokeWidth={1.7} />
      </span>
      <h3 className="m-0 text-[17px] font-semibold text-white">Run it automatically (optional)</h3>
      <p className="m-0 max-w-[400px] text-sm text-white/72">
        Once the agent is created, open its chat and choose <strong className="font-semibold text-white">Create trigger</strong> in the side panel to
        run it on a schedule or when something happens in an app.
      </p>
    </div>
  );
}

export default TriggersStep;
