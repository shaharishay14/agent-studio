import { useId, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { executeWorkflow } from '../../requests';
import type { StepStatus } from './AgentNode';

interface StartNodeProps {
  data: {
    workflowId?: number;
    agentIds?: string[];
    onExecutionResult?: (agentId: string, message: string) => void;
    onAgentStatus?: (agentId: string, status: StepStatus) => void;
  };
}

// First node: the message that starts the run, and the Run button
function StartNode({ data }: StartNodeProps) {
  const [prompt, setPrompt] = useState('');
  const [isPending, setIsPending] = useState(false);
  const promptId = useId();
  const hasAgents = !!data?.agentIds && data.agentIds.length > 0;

  const handleExecute = async () => {
    if (!prompt.trim()) {
      return;
    }

    if (!data?.workflowId || !data?.agentIds || data.agentIds.length === 0) {
      return;
    }

    // נקה תגובות קודמות
    data.agentIds.forEach(agentId => {
      data.onExecutionResult?.(agentId, '');
      data.onAgentStatus?.(agentId, 'idle');
    });

    setIsPending(true);
    let currentPrompt = prompt.trim();
    let failed = 0;

    try {
      // שליחה סדרתית לכל agent - each agent's answer feeds the next
      for (const agentId of data.agentIds) {
        data.onAgentStatus?.(agentId, 'running');
        try {
          const response = await executeWorkflow(data.workflowId, {
            prompt: currentPrompt,
            agent_id: agentId,
          });

          if (data.onExecutionResult && response?.message) {
            data.onExecutionResult(agentId, response.message);
            currentPrompt = response.message;
          }
          data.onAgentStatus?.(agentId, 'done');
        } catch (error) {
          console.error('Error executing workflow for agent:', agentId, error);
          data.onAgentStatus?.(agentId, 'error');
          failed += 1;
          // המשך לסוכן הבא גם אם יש שגיאה
        }
      }

      if (failed === 0) {
        toast.success('Workflow finished');
      } else {
        toast.error(`Workflow finished, but ${failed} of ${data.agentIds.length} steps failed`);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-[300px] rounded-3xl border border-white/25 bg-night-2 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_50px_-20px_rgba(0,0,0,0.7)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-pill border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-medium">Start</span>
        <span className="text-xs text-white/60">Each step's answer goes to the next</span>
      </div>
      <label htmlFor={promptId} className="mb-1.5 block text-[13px] font-medium text-white/85">
        First message
      </label>
      <textarea
        id={promptId}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What should the first agent do?"
        rows={3}
        className="nodrag nowheel mb-3 min-h-[84px] w-full resize-none rounded-2xl border border-white/25 bg-white/6 px-3.5 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-white/50 focus:border-white/70"
      />
      <Button
        block
        size="sm"
        onClick={handleExecute}
        disabled={!prompt.trim() || !hasAgents}
        loading={isPending}
        title={!hasAgents ? 'Add an agent first' : undefined}
      >
        {!isPending && <Play />}
        {isPending ? 'Running…' : 'Run workflow'}
      </Button>
      {!hasAgents && <p className="mt-2 mb-0 text-center text-xs text-white/55">Add an agent to run this workflow</p>}

      <Handle type="source" position={Position.Right} className="!size-3 !border-2 !border-night-2 !bg-white" />
    </div>
  );
}

export default StartNode;
