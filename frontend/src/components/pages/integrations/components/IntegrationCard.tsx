import { Plug } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { BrandIcon } from '@/components/ui/brand-icon';
import { Button } from '@/components/ui/button';
import type { Integration } from './types';
import { categoryLabel } from '../utils';

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onViewDetails: (id: string) => void;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
}

// Glass card: logo, status or category badge, name, description, View details + Connect / Disconnect
function IntegrationCard({ integration, onConnect, onDisconnect, onViewDetails, isConnecting = false, isDisconnecting = false }: IntegrationCardProps) {
  return (
    <article className="flex flex-col gap-3.5 rounded-3xl border border-white/14 bg-linear-to-b from-white/8 to-white/3 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/30">
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid size-[52px] shrink-0 place-items-center rounded-pill border border-white/35 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          aria-hidden="true"
        >
          <BrandIcon name={integration.slug || integration.name} size={22} fallback={Plug} />
        </span>
        {integration.isConnected ? (
          <Badge status="live">Connected</Badge>
        ) : (
          <Badge dim>{categoryLabel(integration.category)}</Badge>
        )}
      </div>
      <h3 className="m-0 font-display text-lg leading-6 font-medium tracking-[-0.015em]">{integration.name}</h3>
      <p className="m-0 text-sm leading-[21px] text-white/70">{integration.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2.5 pt-1">
        <Button variant="ghost" size="sm" className="px-0" onClick={() => onViewDetails(integration.id)} aria-label={`View details for ${integration.name}`}>
          View details
        </Button>
        {integration.isConnected ? (
          <Button variant="glass" size="sm" onClick={() => onDisconnect(integration.id)} loading={isDisconnecting} aria-label={`Disconnect ${integration.name}`}>
            {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        ) : (
          <Button size="sm" onClick={() => onConnect(integration.id)} loading={isConnecting} aria-label={`Connect ${integration.name}`}>
            {isConnecting ? 'Connecting…' : 'Connect'}
          </Button>
        )}
      </div>
    </article>
  );
}

export default IntegrationCard;
