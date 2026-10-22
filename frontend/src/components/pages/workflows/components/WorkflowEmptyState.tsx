import { Plus, Workflow } from 'lucide-react';

import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';

interface WorkflowEmptyStateProps {
  onCreateWorkflow: () => void;
}

function WorkflowEmptyState({ onCreateWorkflow }: WorkflowEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <BlurFade className="flex max-w-[440px] flex-col items-center gap-4">
        <span
          className="grid size-16 place-items-center rounded-pill border border-white/35 bg-white/10 shadow-[0_0_0_10px_rgba(255,255,255,0.04),0_0_60px_rgba(230,176,109,0.25)]"
          aria-hidden="true"
        >
          <Workflow className="size-7" strokeWidth={1.7} />
        </span>
        <h2 className="m-0 font-display text-[32px] leading-9 font-medium tracking-[-0.03em]">
          Chain agents into a <em className="sky-serif">workflow</em>
        </h2>
        <p className="m-0 text-white/72">Pick a workflow from the list, or create one. Each agent's answer becomes the next agent's message.</p>
        <Button onClick={onCreateWorkflow}>
          <Plus />
          New workflow
        </Button>
      </BlurFade>
    </div>
  );
}

export default WorkflowEmptyState;
