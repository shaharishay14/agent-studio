import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { BlurFade } from '@/components/ui/blur-fade';
import { Button, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AgentCard, NewAgentCard } from '../../../../sky/AgentCard';
import { DeleteConfirmModal } from '../../../agents/components';
import { useDeleteAgent, useGetAgents } from '../../../agents/hooks';
import { ShareAgentModal } from '../../../../shared/modals';
import useModalsStore from '../../../../../../store/modals.store';

const MAX_SHOWN = 5;

// Logged-in home: the user's latest agents under the hero, plus a "Describe a new agent" card
// that jumps back to the prompt box.
function YourAgents() {
  const { openShareAgentModal } = useModalsStore();
  const { agents, isLoading, isError, refetch } = useGetAgents();
  const { isDeleting, deleteModal, handleDeleteClick, handleConfirmDelete, handleCancelDelete } = useDeleteAgent();

  const focusPrompt = () => {
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>('#top textarea')?.focus({ preventScroll: true }), 400);
  };

  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="m-0 font-display text-[36px] leading-10 font-medium tracking-[-0.035em] sm:text-[44px] sm:leading-12">
            Your <em className="sky-serif">agents</em>
          </h2>
          {agents && agents.length > MAX_SHOWN && (
            <Link to="/agents" className={buttonVariants({ variant: 'glass', size: 'sm' })}>
              View all
              <ArrowRight />
            </Link>
          )}
        </div>

        {isLoading && (
          <div className="grid min-h-[220px] place-items-center">
            <Spinner label="Loading your agents" />
          </div>
        )}

        {isError && (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-card border border-white/12 bg-night-2 p-8 text-center">
            <p className="m-0 text-white/72">We couldn't load your agents.</p>
            <Button variant="glass" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && agents && (
          <BlurFade inView>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {agents.slice(0, MAX_SHOWN).map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onShare={(a) => openShareAgentModal(a.id, a.name)}
                  onDelete={(a) => handleDeleteClick(agents, a.id)}
                />
              ))}
              <NewAgentCard
                to="#top"
                onClick={(e) => {
                  e.preventDefault();
                  focusPrompt();
                }}
              />
            </div>
          </BlurFade>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        agentName={deleteModal.agentName || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
      <ShareAgentModal />
    </section>
  );
}

export default YourAgents;
