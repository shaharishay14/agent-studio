import { BlurFade } from '@/components/ui/blur-fade';
import { Chip } from '@/components/ui/chip';
import { AgentAvatar } from '../../../sky/AgentAvatar';
import type { Agent } from '../types';

interface ChatEmptyStateProps {
  agentData?: Agent;
  suggestedPrompts: string[];
  setMessageText: (text: string) => void;
}

// New conversation: the agent, one line about it, and the suggested prompts (when the API has them)
export const ChatEmptyState = ({ agentData, suggestedPrompts, setMessageText }: ChatEmptyStateProps) => {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[640px] flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <BlurFade className="flex flex-col items-center gap-4">
        {agentData && <AgentAvatar id={agentData.id} avatar={agentData.avatar_base64} size={64} className="shadow-[0_0_0_8px_rgba(255,255,255,0.08)]" />}
        <h2 className="m-0 font-display text-[32px] leading-9 font-medium tracking-[-0.03em]">
          Start a chat with <em className="sky-serif">{agentData?.name || 'your agent'}</em>
        </h2>
        {agentData?.prompt && <p className="m-0 line-clamp-2 max-w-[52ch] text-white/72">{agentData.prompt}</p>}
      </BlurFade>
      {suggestedPrompts.length > 0 && (
        <BlurFade delay={0.12} className="flex flex-wrap justify-center gap-2.5">
          {suggestedPrompts.slice(0, 3).map((prompt) => (
            <Chip key={prompt} onClick={() => setMessageText(prompt)} className="h-auto min-h-[38px] py-2 text-left whitespace-normal">
              {prompt}
            </Chip>
          ))}
        </BlurFade>
      )}
    </div>
  );
};
