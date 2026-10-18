import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { executeWorkflow } from '../../requests';
import { toast } from 'sonner';

interface StartNodeProps {
  data: {
    workflowId?: number;
    agentIds?: string[];
    onExecutionResult?: (agentId: string, message: string) => void;
  };
}

function StartNode({ data }: StartNodeProps) {
  const [prompt, setPrompt] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleExecute = async () => {
    if (!prompt.trim()) {
      return;
    }

    if (!data?.workflowId || !data?.agentIds || data.agentIds.length === 0) {
      return;
    }

    // נקה תגובות קודמות
    if (data.onExecutionResult) {
      data.agentIds.forEach(agentId => {
        data.onExecutionResult?.(agentId, '');
      });
    }

    setIsPending(true);
    let currentPrompt = prompt.trim();

    try {
      // שליחה סדרתית לכל agent
      for (const agentId of data.agentIds) {
        try {
          const response = await executeWorkflow(data.workflowId, {
            prompt: currentPrompt,
            agent_id: agentId,
          });
          
          // עדכן את התגובה ב-AgentNode
          if (data.onExecutionResult && response?.message) {
            data.onExecutionResult(agentId, response.message);
            // השתמש ב-message לשליחה הבאה
            currentPrompt = response.message;
          }
        } catch (error: any) {
          console.error('Error executing workflow for agent:', agentId, error);
          // המשך לסוכן הבא גם אם יש שגיאה
        }
      }
      
      toast.success('Workflow בוצע בהצלחה!');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'שגיאה בביצוע workflow';
      toast.error(message);
      console.error('Error executing workflow:', error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="group relative bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-2 border-green-500/50 rounded-2xl p-6 min-w-[280px] transition-all duration-300 hover:border-green-400/80 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-green-500/50">
      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={handleExecute}
          disabled={isPending || !prompt.trim() || !data?.agentIds || data.agentIds.length === 0}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 group-hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] group-hover:shadow-green-500/70 group-hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isPending ? 'Executing...' : 'Execute Workflow'}
        </button>
        
        <div className="w-full">
          <div className="text-white font-semibold text-sm mb-2">Start</div>
          <div className="text-green-400 text-xs mb-1">Click to execute workflow</div>
          
          <div className="mt-3">
            <div className="text-green-400 text-xs font-semibold mb-1">Initial Message</div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the initial message for the workflow..."
              className="w-full bg-black/30 border border-green-500/30 rounded-lg p-3 text-gray-300 text-xs resize-none focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 min-h-[80px]"
              rows={3}
            />
          </div>
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-green-400"
      />
    </div>
  );
}

export default StartNode;

