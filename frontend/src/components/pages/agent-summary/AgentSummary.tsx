import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, LayoutGrid, MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { StatusDot } from '@/components/ui/status-dot';
import { AgentAvatar } from '../../sky/AgentAvatar';
import { StatusScreen } from '../../sky/StatusScreen';
import type { Agent } from '../builder/types';

function AgentSummary() {
  const navigate = useNavigate();
  const [agentData, setAgentData] = useState<Agent | null>(null);

  useEffect(() => {
    // Get agent data from sessionStorage
    const storedData = sessionStorage.getItem('newAgentData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as Agent;
        setAgentData(data);
        // Clear from sessionStorage after reading
        sessionStorage.removeItem('newAgentData');
      } catch (error) {
        console.error('Error parsing agent data:', error);
        navigate('/builder');
      }
    } else {
      // No data found, redirect to builder
      // navigate('/builder');
    }
  }, [navigate]);

  if (!agentData) {
    return null;
  }

  const { id, name, created_at, avatar_base64 } = agentData;

  return (
    <StatusScreen className="gap-4">
      <span className="grid size-12 place-items-center rounded-pill bg-white text-on-white shadow-[0_0_0_8px_rgba(255,255,255,0.1),0_0_50px_rgba(230,176,109,0.35)]" aria-hidden="true">
        <Check className="size-6" strokeWidth={2} />
      </span>
      <h1 className="m-0 font-display text-[28px] leading-8 font-medium tracking-[-0.03em]">
        Your agent is <em className="sky-serif">ready</em>
      </h1>

      <div className="flex w-full items-center gap-3.5 rounded-inner border border-white/15 bg-white/[0.05] p-4 text-left">
        <AgentAvatar id={id} avatar={avatar_base64} size={52} />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[17px] font-semibold">{name}</p>
          <p className="m-0 flex items-center gap-1.5 text-[13px] text-white/72">
            <StatusDot status="live" />
            Ready to chat
          </p>
          <p className="m-0 text-[13px] text-white/60">
            Created {new Date(created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5 sm:flex-row">
        <Link to={`/chat/${id}`} className={cn(buttonVariants({ variant: 'white' }), 'sm:flex-1')}>
          <MessageSquare />
          Start chatting
        </Link>
        <Link to="/agents" className={cn(buttonVariants({ variant: 'glass' }), 'sm:flex-1')}>
          <LayoutGrid />
          All agents
        </Link>
      </div>
      <p className="m-0 text-[13px] text-white/60">You can change its settings any time from the chat.</p>
    </StatusScreen>
  );
}

export default AgentSummary;
