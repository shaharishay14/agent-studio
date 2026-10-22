import { useId, useState } from 'react';
import { CalendarClock, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import type { Status } from '@/components/ui/status-dot';
import type { Workflow } from '../types';
import useModalsStore from '../../../../../store/modals.store';

interface WorkflowCardProps {
  workflow: Workflow;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const STATUS: Record<Workflow['status'], { label: string; dot: Status }> = {
  active: { label: 'Active', dot: 'live' },
  draft: { label: 'Draft', dot: 'idle' },
  inactive: { label: 'Inactive', dot: 'idle' },
};

// Edit and Delete are always visible, so they work on touch screens too
function WorkflowCard({ workflow, isSelected, onSelect, onEdit, onDelete }: WorkflowCardProps) {
  const { openCreateTriggerModalForWorkflow } = useModalsStore();
  const [isTriggersExpanded, setIsTriggersExpanded] = useState(false);
  const triggersId = useId();
  const status = STATUS[workflow.status] ?? STATUS.draft;
  const steps = workflow.agents?.length ?? (Number(workflow.nodes) || 0);

  return (
    <article
      className={cn(
        'relative flex flex-col gap-3 rounded-inner border p-4 transition-colors duration-200',
        isSelected
          ? 'border-white/55 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
          : 'border-white/12 bg-white/[0.03] hover:border-white/28'
      )}
    >
      <div className="flex items-start gap-2">
        <h3 className="m-0 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onSelect(workflow.id)}
            aria-current={isSelected ? 'true' : undefined}
            className="block w-full truncate rounded-sm text-left text-[15px] font-semibold text-white after:absolute after:inset-0 after:rounded-inner focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-white"
          >
            {workflow.name}
          </button>
        </h3>
        <div className="relative z-10 -mt-1 -mr-1 flex shrink-0">
          <IconButton size="sm" aria-label={`Edit ${workflow.name}`} onClick={() => onEdit(workflow.id)}>
            <Pencil />
          </IconButton>
          <IconButton size="sm" aria-label={`Delete ${workflow.name}`} onClick={() => onDelete(workflow.id)} className="hover:text-off">
            <Trash2 />
          </IconButton>
        </div>
      </div>

      {workflow.description && <p className="m-0 line-clamp-2 text-sm leading-5 text-white/66">{workflow.description}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Badge status={status.dot} dim={workflow.status !== 'active'}>
          {status.label}
        </Badge>
        <Badge dim>
          {steps} {steps === 1 ? 'step' : 'steps'}
        </Badge>
      </div>

      <div className="relative z-10">
        <button
          type="button"
          onClick={() => setIsTriggersExpanded((open) => !open)}
          aria-expanded={isTriggersExpanded}
          aria-controls={triggersId}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-white/80 hover:bg-white/6 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          <CalendarClock className="size-4" strokeWidth={1.7} aria-hidden="true" />
          Triggers
          <ChevronDown className={cn('ml-auto size-4 transition-transform', isTriggersExpanded && 'rotate-180')} strokeWidth={1.7} aria-hidden="true" />
        </button>

        {isTriggersExpanded && (
          <div id={triggersId} className="mt-2 flex animate-sky-in flex-col gap-3 rounded-2xl border border-white/12 bg-night/40 p-3.5">
            <p className="m-0 text-[13px] text-white/66">Run this workflow on a schedule or when something happens in an app.</p>
            <Button size="sm" block onClick={() => openCreateTriggerModalForWorkflow(workflow.id)}>
              <Plus />
              Create trigger
            </Button>
            <p className="m-0 text-center text-xs text-white/55">No triggers yet</p>
          </div>
        )}
      </div>
    </article>
  );
}

export default WorkflowCard;
