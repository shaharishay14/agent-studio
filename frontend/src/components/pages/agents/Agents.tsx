import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, SearchX } from 'lucide-react';

import { BlurFade } from '@/components/ui/blur-fade';
import { Button, buttonVariants } from '@/components/ui/button';
import { HaloToggleGroup } from '@/components/ui/halo-toggle-group';
import { SearchDock } from '@/components/ui/search-dock';
import { Spinner } from '@/components/ui/spinner';
import { AgentCard, NewAgentCard } from '../../sky/AgentCard';
import { TopBarSlot } from '../../sky/AppTopBar';
import { HeaderBand } from '../../sky/HeaderBand';
import { DeleteConfirmModal } from './components';
import { useGetAgents, useDeleteAgent } from './hooks';
import ShareAgentModal from '../../shared/modals/ShareAgentModal';
import useModalsStore from '../../../../store/modals.store';
import type { Agent } from './types';

type SortKey = 'newest' | 'oldest' | 'most-used';

// Agents have no status / schedule / draft fields, so the halo toggle sorts by real data
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most-used', label: 'Most used' },
];

const sorters: Record<SortKey, (a: Agent, b: Agent) => number> = {
  newest: (a, b) => b.created_at.localeCompare(a.created_at),
  oldest: (a, b) => a.created_at.localeCompare(b.created_at),
  'most-used': (a, b) => b.message_count - a.message_count,
};

function Agents() {
  const { openShareAgentModal } = useModalsStore();
  const { agents, isLoading, isError, refetch } = useGetAgents();
  const { isDeleting, deleteModal, handleDeleteClick, handleConfirmDelete, handleCancelDelete } = useDeleteAgent();
  const [sort, setSort] = useState<SortKey>('newest');
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...(agents ?? [])]
      .filter((a) => !q || a.name.toLowerCase().includes(q) || a.prompt.toLowerCase().includes(q))
      .sort(sorters[sort]);
  }, [agents, query, sort]);

  const count = agents?.length ?? 0;
  const subtitle = isLoading
    ? 'Loading your agents…'
    : count === 0
      ? 'No agents yet. Describe one in a sentence to get started.'
      : `${count} ${count === 1 ? 'agent' : 'agents'}. Open one to chat, change its tools or give it a schedule.`;

  return (
    <div className="min-h-screen bg-night text-white">
      {count > 0 && (
        <TopBarSlot>
          <SearchDock value={query} onChange={setQuery} label="Search agents" placeholder="Search by name or prompt…" />
        </TopBarSlot>
      )}

      <HeaderBand
        eyebrow="Agents"
        title="Your"
        accent="agents"
        subtitle={subtitle}
        actions={
          <>
            {count > 1 && (
              <HaloToggleGroup items={SORTS} value={sort} onValueChange={(v) => setSort(v as SortKey)} aria-label="Sort agents" />
            )}
            <Link to="/builder" className={buttonVariants({ variant: 'white' })}>
              <Plus />
              New agent
            </Link>
          </>
        }
      />

      <main className="mx-auto max-w-[1280px] px-4 pt-7 pb-20 sm:px-6 lg:px-10">
        {isLoading && (
          <div className="grid min-h-[260px] place-items-center">
            <Spinner label="Loading your agents" />
          </div>
        )}

        {isError && (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-card border border-white/12 bg-night-2 p-8 text-center" role="alert">
            <p className="m-0 text-white/72">We couldn't load your agents.</p>
            <Button variant="glass" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && query && shown.length === 0 && (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-card border border-white/12 bg-night-2 p-8 text-center" role="status">
            <SearchX className="size-6 text-white/60" strokeWidth={1.7} aria-hidden="true" />
            <p className="m-0 text-white/72">No agents match “{query}”.</p>
            <Button variant="glass" size="sm" onClick={() => setQuery('')}>
              Clear search
            </Button>
          </div>
        )}

        {!isLoading && !isError && (shown.length > 0 || !query) && (
          <BlurFade>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onShare={(a) => openShareAgentModal(a.id, a.name)}
                  onDelete={(a) => handleDeleteClick(agents, a.id)}
                />
              ))}
              {!query && <NewAgentCard />}
            </div>
          </BlurFade>
        )}
      </main>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        agentName={deleteModal.agentName || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      <ShareAgentModal />
    </div>
  );
}

export default Agents;
