import { Plus, Workflow as WorkflowIcon, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, IconButton } from '@/components/ui/button';
import type { Workflow } from '../types';
import WorkflowCard from './WorkflowCard';

interface WorkflowSidebarProps {
  workflows: Workflow[];
  selectedWorkflowId: number | null;
  onSelectWorkflow: (id: number) => void;
  onCreateWorkflow: () => void;
  onEditWorkflow: (id: number) => void;
  onDeleteWorkflow: (id: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

// Workflow list: a column on desktop, full screen on phones
function WorkflowSidebar({
  workflows,
  selectedWorkflowId,
  onSelectWorkflow,
  onCreateWorkflow,
  onEditWorkflow,
  onDeleteWorkflow,
  onClose,
  isOpen,
}: WorkflowSidebarProps) {
  return (
    <aside
      aria-label="Workflows"
      className={cn(
        'min-h-0 flex-col border-r border-white/10 bg-side',
        isOpen ? 'absolute inset-0 z-30 flex md:static md:w-[340px] md:shrink-0' : 'hidden'
      )}
    >
      <div className="flex flex-col gap-4 border-b border-white/10 p-5">
        <div className="flex items-center gap-2">
          <h2 className="m-0 flex-1 font-display text-[22px] leading-7 font-medium tracking-[-0.02em]">
            Your <em className="sky-serif">workflows</em>
          </h2>
          <IconButton aria-label="Hide workflows" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <Button size="sm" block onClick={onCreateWorkflow}>
          <Plus />
          New workflow
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-inner border border-dashed border-white/15 px-4 py-10 text-center">
            <WorkflowIcon className="size-6 text-white/55" strokeWidth={1.7} aria-hidden="true" />
            <p className="m-0 text-sm font-medium">No workflows yet</p>
            <p className="m-0 text-[13px] text-white/60">Chain agents so one answer feeds the next.</p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              isSelected={selectedWorkflowId === workflow.id}
              onSelect={onSelectWorkflow}
              onEdit={onEditWorkflow}
              onDelete={onDeleteWorkflow}
            />
          ))
        )}
      </div>
    </aside>
  );
}

export default WorkflowSidebar;
