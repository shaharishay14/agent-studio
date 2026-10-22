import type { Integration } from './types';
import IntegrationCard from './IntegrationCard';

interface IntegrationGridProps {
  integrations: Integration[];
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onViewDetails: (id: string) => void;
  isConnecting: boolean;
  connectingToolName: string | null | undefined;
  isDisconnecting: boolean;
  disconnectingToolName: string | null | undefined;
}

// "Connected" and "Not connected" groups
function IntegrationGrid({ integrations, onConnect, onDisconnect, onViewDetails, isConnecting, connectingToolName, isDisconnecting, disconnectingToolName }: IntegrationGridProps) {
  // חלוקה לאינטגרציות מחוברות ולא מחוברות
  const groups = [
    { label: 'Connected', items: integrations.filter(i => i.isConnected) },
    { label: 'Not connected', items: integrations.filter(i => !i.isConnected) },
  ];

  return (
    <div className="flex flex-col gap-10">
      {groups.map(({ label, items }) =>
        items.length > 0 ? (
          <section key={label} aria-label={label}>
            <h2 className="m-0 mb-4 text-xs font-normal tracking-[0.08em] text-white/66 uppercase">
              {label} · {items.length}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={onConnect}
                  onDisconnect={onDisconnect}
                  onViewDetails={onViewDetails}
                  isConnecting={isConnecting && connectingToolName === integration.name}
                  isDisconnecting={isDisconnecting && disconnectingToolName === integration.name}
                />
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}

export default IntegrationGrid;
