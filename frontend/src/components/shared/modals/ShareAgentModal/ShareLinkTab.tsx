import { Copy, ExternalLink } from 'lucide-react';

import { Button, IconButton } from '@/components/ui/button';
import type { ShareLinkTabProps } from './types';

export function ShareLinkTab({ agentLink, onCopy }: ShareLinkTabProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-white/72">Anyone with the link can chat with this agent. They can't see its settings or files.</p>
      <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-night/60 py-1.5 pr-1.5 pl-4">
        <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-white/85">{agentLink}</code>
        <a
          href={agentLink}
          target="_blank"
          rel="noreferrer"
          aria-label="Open the public chat in a new tab"
          className="inline-grid size-9 shrink-0 place-items-center rounded-pill text-white/80 hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-white [&_svg]:size-4"
        >
          <ExternalLink strokeWidth={1.7} />
        </a>
        <IconButton aria-label="Copy link" onClick={() => onCopy(agentLink, 'Link')} className="size-9">
          <Copy />
        </IconButton>
      </div>
      <Button block onClick={() => onCopy(agentLink, 'Link')}>
        <Copy />
        Copy link
      </Button>
    </div>
  );
}
