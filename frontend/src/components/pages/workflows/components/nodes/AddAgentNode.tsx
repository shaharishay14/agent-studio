import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';

interface AddAgentNodeProps {
  data: {
    onAddAgent?: () => void;
  };
}

// Dashed "Add an agent" step at the end of the chain
function AddAgentNode({ data }: AddAgentNodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="!size-3 !border-2 !border-night !bg-white/40" />
      <button
        type="button"
        onClick={data.onAddAgent}
        className="nodrag flex w-[220px] flex-col items-center gap-3 rounded-3xl border border-dashed border-white/30 bg-white/[0.03] px-6 py-7 text-white/80 transition-colors hover:border-white/55 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
      >
        <span className="grid size-[52px] place-items-center rounded-pill border border-white/35 bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" aria-hidden="true">
          <Plus className="size-5" strokeWidth={1.7} />
        </span>
        <span className="font-semibold">Add an agent</span>
        <span className="text-xs text-white/60">It gets the previous step's answer</span>
      </button>
    </div>
  );
}

export default AddAgentNode;
