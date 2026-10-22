import { Handle, Position } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, ExternalLink, Trash2, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AgentAvatar } from '../../../../sky/AgentAvatar';
import { isHebrewText } from '../../../chat/utils';

export type StepStatus = 'idle' | 'running' | 'done' | 'error';

interface AgentNodeProps {
  data: {
    label: string;
    avatar_base64?: string | null;
    agentId?: string;
    step?: number;
    status?: StepStatus;
    executionResult?: string;
    onDelete?: () => void;
    onOpenInNewTab?: () => void;
  };
}

const STATUS: Record<Exclude<StepStatus, 'idle'>, { label: string; icon: React.ReactNode; border: string }> = {
  running: { label: 'Running', icon: <Spinner size={12} />, border: 'border-white/60 shadow-[0_0_30px_rgba(230,176,109,0.25)]' },
  done: { label: 'Done', icon: <Check className="text-live" />, border: 'border-live/50' },
  error: { label: 'Failed', icon: <X className="text-off" />, border: 'border-off/60' },
};

// One agent step. Open and Remove are always visible (no hover-only actions).
function AgentNode({ data }: AgentNodeProps) {
  const isHebrew = data.executionResult ? isHebrewText(data.executionResult) : false;
  const status = data.status && data.status !== 'idle' ? STATUS[data.status] : null;

  return (
    <div
      className={cn(
        'w-[320px] rounded-3xl border bg-night-2 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_50px_-20px_rgba(0,0,0,0.7)] transition-[border-color,box-shadow] duration-300',
        status ? status.border : 'border-white/20'
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-3 !border-2 !border-night-2 !bg-white" />

      <div className="flex items-center gap-3">
        <AgentAvatar id={data.agentId || data.label} avatar={data.avatar_base64} size={40} />
        <div className="min-w-0 flex-1">
          {data.step && <div className="text-xs text-white/55">Step {data.step}</div>}
          <div className="truncate text-sm font-semibold">{data.label}</div>
        </div>
        <div className="nodrag flex shrink-0 gap-0.5">
          <IconButton size="sm" aria-label={`Open ${data.label} in a new tab`} onClick={(e) => { e.stopPropagation(); data.onOpenInNewTab?.(); }}>
            <ExternalLink />
          </IconButton>
          <IconButton size="sm" aria-label={`Remove ${data.label} from the workflow`} onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }} className="hover:text-off">
            <Trash2 />
          </IconButton>
        </div>
      </div>

      {status && (
        <div className="mt-3" aria-live="polite">
          <Badge className="[&_svg]:size-3 [&_svg]:stroke-2">
            {status.icon}
            {status.label}
          </Badge>
        </div>
      )}

      {data.executionResult && data.executionResult.trim() && (
        <div className="nodrag nowheel mt-3 max-h-[160px] overflow-y-auto rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 py-3">
          <div dir={isHebrew ? 'rtl' : 'ltr'} className="sky-prose text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.executionResult}</ReactMarkdown>
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!size-3 !border-2 !border-night-2 !bg-white" />
    </div>
  );
}

export default AgentNode;
