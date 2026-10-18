import { AgentsGrid, DeleteConfirmModal } from '../../agents/components';
import { useGetAgents, useDeleteAgent } from '../../agents/hooks';
import { LoadingState, ErrorState } from '../../../shared/components';
import { ShareAgentModal } from '../../../shared/modals';
import useDarkModeStore from '../../../../../store/darkmode.store';
import useModalsStore from '../../../../../store/modals.store';
import EmptyAgent from './EmptyAgent';

function AgentsSection() {
  const { isDarkMode } = useDarkModeStore();
  const { openShareAgentModal } = useModalsStore();
  const { agents, isLoading, isError } = useGetAgents();
  const { 
    isDeleting, 
    deleteModal,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete 
  } = useDeleteAgent();

  const handleShare = (id: string) => {
    const agent = agents?.find(a => a.id === id);
    if (agent) {
      openShareAgentModal(agent.id, agent.name);
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-20 px-4">
        <LoadingState message="Loading your agents..." />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-12 md:py-20 px-4">
        <ErrorState message="Error loading agents" />
      </section>
    );
  }

  if (!agents || agents.length === 0) {
    return <EmptyAgent />;
  }

  return (
    <>
      <section className="py-12 md:py-20 px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Agents</span>
          </h2>
          <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto">
          <AgentsGrid 
            agents={agents}
            onShare={handleShare}
            onDelete={(id) => handleDeleteClick(agents, id)}
          />
        </div>
      </section>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        agentName={deleteModal.agentName || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
      
      <ShareAgentModal />
    </>
  );
}

export default AgentsSection;



