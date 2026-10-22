import { Link, NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AgentAvatar } from '../../../sky/AgentAvatar';
import { useGetAgents } from '../../agents/hooks';

// Left column on wide screens: New agent + the user's agents, current one highlighted
export const AgentList = () => {
  const { agents, isLoading } = useGetAgents();

  return (
    <aside className="hidden min-h-0 flex-col gap-1.5 overflow-y-auto border-r border-white/10 bg-side p-[18px] lg:flex" aria-label="Your agents">
      <Link to="/builder" className={cn(buttonVariants({ variant: 'white', size: 'sm' }), 'mb-3')}>
        <Plus />
        New agent
      </Link>
      <span className="my-1.5 text-xs tracking-[0.08em] text-white/66 uppercase">Your agents</span>
      {isLoading && <Spinner size={20} className="m-3" label="Loading agents" />}
      <nav className="flex flex-col gap-1">
        {agents?.map((agent) => (
          <NavLink
            key={agent.id}
            to={`/chat/${agent.id}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-[14px] px-2.5 py-[9px] text-sm no-underline transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                isActive ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]' : 'text-white/75 hover:bg-white/6 hover:text-white'
              )
            }
          >
            <AgentAvatar id={agent.id} avatar={agent.avatar_base64} size={28} />
            <span className="truncate">{agent.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
