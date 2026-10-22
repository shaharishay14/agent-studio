import { LogoMark } from '@/components/ui/logo';
import { StatusDot } from '@/components/ui/status-dot';
import { AgentAvatar } from '../../../sky/AgentAvatar';
import type { Agent } from '../../chat/types';

interface PublicChatHeaderProps {
  agent: Agent;
}

function PublicChatHeader({ agent }: PublicChatHeaderProps) {
  return (
    <header className="relative flex shrink-0 items-center gap-3 border-b border-white/15 px-4 py-3 sm:px-7">
      {/* Glass on its own layer so it can blur the photo behind it */}
      <span className="absolute inset-0 -z-10 bg-night/45 backdrop-blur-[20px] backdrop-saturate-[1.4]" aria-hidden="true" />
      <AgentAvatar id={agent.id} avatar={agent.avatar_base64} size={40} />
      <div className="min-w-0 flex-1">
        <h1 className="m-0 truncate font-display text-lg leading-6 font-medium tracking-[-0.02em]">{agent.name}</h1>
        <p className="m-0 flex items-center gap-1.5 text-[13px] text-white/72">
          <StatusDot status="live" />
          Online
        </p>
      </div>
      <a
        href={import.meta.env.VITE_FRONT_URL || '/'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-2 rounded-pill border border-white/25 bg-white/8 py-1.5 pr-3.5 pl-1.5 text-xs text-white/80 no-underline transition-colors hover:border-white/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
      >
        <LogoMark size={22} />
        <span>
          <span className="hidden sm:inline">Made with </span>
          <span className="font-semibold text-white">Agent Studio</span>
        </span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </header>
  );
}

export default PublicChatHeader;
