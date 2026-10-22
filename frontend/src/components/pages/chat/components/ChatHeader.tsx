import { DropdownMenu } from 'radix-ui';
import { Link2, RotateCcw, Send, Share2, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { BrandIcon } from '@/components/ui/brand-icon';
import { IconButton } from '@/components/ui/button';
import { StatusDot, type Status } from '@/components/ui/status-dot';
import { Tooltip } from '@/components/ui/tooltip';
import { AgentAvatar } from '../../../sky/AgentAvatar';
import { splitToolName } from '../utils';
import type { Agent } from '../types';

interface ChatHeaderProps {
  agentData?: Agent;
  agentId: string;
  isWorking: boolean;
  needsApproval: boolean;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  openResetMemoryModal: (agentId: string) => void;
  openShareAgentModal: (agentId: string, agentName: string) => void;
  openTelegramBotModal: (agentId: string) => void;
}

const itemClass =
  'flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/85 outline-none data-highlighted:bg-white/12 data-highlighted:text-white [&_svg]:size-4 [&_svg]:stroke-[1.7]';

// Glass header over the dusk photo: agent, live status, connected apps, and the agent actions
export const ChatHeader = ({
  agentData,
  agentId,
  isWorking,
  needsApproval,
  isSettingsOpen,
  onToggleSettings,
  openResetMemoryModal,
  openShareAgentModal,
  openTelegramBotModal,
}: ChatHeaderProps) => {
  const [status, statusLabel]: [Status, string] = needsApproval
    ? ['busy', 'Needs your approval']
    : isWorking
      ? ['busy', 'Working']
      : ['live', 'Ready'];

  const connections = agentData?.app_connections ?? [];
  const firstApp = connections[0] ? splitToolName(connections[0]).app : null;

  const shareOnWhatsApp = () => {
    const url = `${window.location.origin}/public/chat/${agentId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <header className="flex items-center gap-3 border-b border-white/18 bg-night/35 px-4 py-3.5 backdrop-blur-[18px] sm:px-7 sm:py-4">
      {agentData && <AgentAvatar id={agentData.id} avatar={agentData.avatar_base64} size={40} />}
      <div className="flex min-w-0 flex-col">
        <b className="truncate font-semibold">{agentData?.name || 'Agent'}</b>
        <span className="inline-flex items-center gap-1.5 text-xs text-white/85" aria-live="polite">
          <StatusDot status={status} />
          {statusLabel}
        </span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {firstApp && (
          <Badge status="live" className="hidden sm:inline-flex">
            <BrandIcon name={firstApp} size={12} />
            {connections.length === 1 ? `${firstApp} connected` : `${connections.length} apps connected`}
          </Badge>
        )}

        <Tooltip content="Reset memory">
          <IconButton aria-label="Reset memory" onClick={() => openResetMemoryModal(agentId)}>
            <RotateCcw />
          </IconButton>
        </Tooltip>

        <DropdownMenu.Root modal={false}>
          <Tooltip content="Share">
            <DropdownMenu.Trigger asChild>
              <IconButton aria-label="Share agent">
                <Share2 />
              </IconButton>
            </DropdownMenu.Trigger>
          </Tooltip>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={10}
              className="z-[60] w-64 animate-sky-in rounded-3xl border border-white/25 bg-night/85 p-2 text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] backdrop-blur-[24px]"
            >
              <DropdownMenu.Item className={itemClass} onSelect={() => openShareAgentModal(agentId, agentData?.name || 'Agent')}>
                <Link2 />
                Link, QR code or embed
              </DropdownMenu.Item>
              <DropdownMenu.Item className={itemClass} onSelect={shareOnWhatsApp}>
                <BrandIcon name="WhatsApp" size={16} />
                Send the link on WhatsApp
              </DropdownMenu.Item>
              <DropdownMenu.Item className={itemClass} onSelect={() => openTelegramBotModal(agentId)}>
                <Send />
                Connect a Telegram bot
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <Tooltip content="Agent settings">
          <IconButton
            aria-label="Agent settings"
            aria-expanded={isSettingsOpen}
            aria-controls="agent-settings"
            onClick={onToggleSettings}
            className={isSettingsOpen ? 'bg-white/12 text-white' : undefined}
          >
            <SlidersHorizontal />
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
};
