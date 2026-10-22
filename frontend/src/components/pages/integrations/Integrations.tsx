import { useMemo } from 'react';
import { SearchX } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { SearchDock } from '@/components/ui/search-dock';
import { Spinner } from '@/components/ui/spinner';
import { TopBarSlot } from '../../sky/AppTopBar';
import { HeaderBand } from '../../sky/HeaderBand';
import IntegrationGrid from './components/IntegrationGrid';
import type { FilterCategory } from './components/types';
import { IntegrationDetailsModal } from './modal';
import useModalsStore from '../../../../store/modals.store';
import { useAvailableTools, useConnectTool, useDisconnectTool, useSearchAndFilter } from './hooks';
import { categoryLabel } from './utils';

function Integrations() {
  const { openIntegrationDetailsModal } = useModalsStore();

  // שליפת כלים זמינים מהשרת והמרה לאינטגרציות
  const { integrations, isLoading, isError, refetch } = useAvailableTools();
  // חיבור כלי
  const { connectTool, isConnecting, connectingToolName } = useConnectTool(integrations, refetch);

  // ניתוק כלי
  const { disconnectTool, isDisconnecting, disconnectingToolName } = useDisconnectTool(integrations);

  // חיפוש וסינון
  const { selectedFilter, setSelectedFilter, searchQuery, setSearchQuery, filteredIntegrations } = useSearchAndFilter(integrations);

  const connectedCount = integrations.filter((i) => i.isConnected).length;

  // Only offer the categories that have integrations
  const categories = useMemo(
    () => [...new Set(integrations.map((i) => i.category))].sort().map((c) => categoryLabel(c) as FilterCategory),
    [integrations]
  );

  const handleViewDetails = (id: string) => {
    const integration = integrations.find((i) => i.id === id);
    if (!integration) {
      console.error('Integration not found:', id);
      return;
    }
    openIntegrationDetailsModal(integration.id, integration.name, integration.slug);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFilter('All');
  };

  return (
    <div className="min-h-screen bg-night text-white">
      <TopBarSlot>
        <SearchDock value={searchQuery} onChange={setSearchQuery} label="Search integrations" placeholder="Check if we support your tool…" />
      </TopBarSlot>

      <HeaderBand
        eyebrow="Integrations"
        title="Connect your"
        accent="tools"
        subtitle={
          !isLoading && !isError ? (
            <span className="mt-1 flex flex-wrap gap-2.5">
              <Badge>{integrations.length} available</Badge>
              <Badge status={connectedCount > 0 ? 'live' : 'idle'}>{connectedCount} connected</Badge>
            </span>
          ) : undefined
        }
        below={
          categories.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
              {(['All', ...categories] as FilterCategory[]).map((filter) => (
                <Chip key={filter} active={selectedFilter === filter} onClick={() => setSelectedFilter(filter)} className="shrink-0">
                  {filter}
                </Chip>
              ))}
            </div>
          ) : undefined
        }
      />

      <main className="mx-auto max-w-[1280px] px-4 pt-4 pb-20 sm:px-6 lg:px-10">

        {isLoading && (
          <div className="grid min-h-[300px] place-items-center">
            <Spinner label="Loading integrations" />
          </div>
        )}

        {isError && (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-card border border-white/12 bg-night-2 p-8 text-center" role="alert">
            <p className="m-0 text-white/72">We couldn't load the integrations.</p>
            <Button variant="glass" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && filteredIntegrations.length === 0 && (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-card border border-white/12 bg-night-2 p-8 text-center" role="status">
            <SearchX className="size-6 text-white/60" strokeWidth={1.7} aria-hidden="true" />
            <p className="m-0 text-white/72">
              {integrations.length === 0
                ? 'No integrations are available yet.'
                : searchQuery
                  ? `We don't support “${searchQuery}” yet.`
                  : 'Nothing in this category.'}
            </p>
            {integrations.length > 0 && (
              <Button variant="glass" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}

        {!isLoading && !isError && filteredIntegrations.length > 0 && (
          <BlurFade>
            <IntegrationGrid
              integrations={filteredIntegrations}
              onConnect={connectTool}
              onDisconnect={disconnectTool}
              onViewDetails={handleViewDetails}
              isConnecting={isConnecting}
              connectingToolName={connectingToolName}
              isDisconnecting={isDisconnecting}
              disconnectingToolName={disconnectingToolName}
            />
          </BlurFade>
        )}
      </main>

      {/* Integration Details Modal */}
      <IntegrationDetailsModal />
    </div>
  );
}

export default Integrations;
