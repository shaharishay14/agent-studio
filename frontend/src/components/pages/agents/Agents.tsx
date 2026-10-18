import { AgentsHeader, AgentsGrid, DeleteConfirmModal, EmptyAgentsState } from './components';
import { useGetAgents, useDeleteAgent } from './hooks';
import { LoadingState, ErrorState } from '../../shared/components';
import ShareAgentModal from '../../shared/modals/ShareAgentModal';
import useDarkModeStore from '../../../../store/darkmode.store';

function Agents() {
  const { isDarkMode } = useDarkModeStore();
  const { agents, isLoading, isError } = useGetAgents();
  const { 
    isDeleting, 
    deleteModal,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete 
  } = useDeleteAgent();


  return (
    <div className={`min-h-screen p-8 relative overflow-hidden ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950'
        : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100'
    }`}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl ${
          isDarkMode
            ? 'bg-purple-500/10'
            : 'bg-purple-300/50'
        }`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl ${
          isDarkMode
            ? 'bg-pink-500/10'
            : 'bg-pink-300/50'
        }`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl ${
          isDarkMode
            ? 'bg-purple-500/5'
            : 'bg-indigo-200/40'
        }`} />
      </div>

      <div className="relative z-10">
      <AgentsHeader />
      
      {isLoading && <LoadingState message="Loading your agents..." />}
      
      {isError && <ErrorState message="Error loading agents" />}
      
      {!isLoading && !isError && agents && agents.length > 0 && (
        <AgentsGrid
          agents={agents}
          onDelete={(id) => handleDeleteClick(agents, id)}
        />
      )}

      {!isLoading && !isError && agents && agents.length === 0 && <EmptyAgentsState />}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        agentName={deleteModal.agentName || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      <ShareAgentModal />
      </div>
    </div>
  );
}

export default Agents;

