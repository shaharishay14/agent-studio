import IntegrationHeader from './components/IntegrationHeader';
import IntegrationFilters from './components/IntegrationFilters';
import IntegrationGrid from './components/IntegrationGrid';
import { LayoutIntegration } from './components';
import { IntegrationDetailsModal } from './modal';
import LoadingState from '../../shared/components/LoadingState';
import useDarkModeStore from '../../../../store/darkmode.store';
import useModalsStore from '../../../../store/modals.store';
import { useAvailableTools, useConnectTool, useDisconnectTool, useSearchAndFilter } from './hooks';

function Integrations() {
  const { isDarkMode } = useDarkModeStore();
  const { openIntegrationDetailsModal } = useModalsStore();
  
  // שליפת כלים זמינים מהשרת והמרה לאינטגרציות
  const { integrations, isLoading, isError, error, refetch } = useAvailableTools();
  // חיבור כלי
  const { connectTool, isConnecting, connectingToolName } = useConnectTool(integrations, refetch);
  
  // ניתוק כלי
  const { disconnectTool, isDisconnecting, disconnectingToolName } = useDisconnectTool(integrations);

  // חיפוש וסינון
  const { 
    selectedFilter, 
    setSelectedFilter, 
    searchQuery, 
    setSearchQuery, 
    filteredIntegrations 
  } = useSearchAndFilter(integrations);

  const connectedCount = integrations.filter(i => i.isConnected).length;

  const handleViewDetails = (id: string) => {
    // מציאת האינטגרציה לפי ה-id
    const integration = integrations.find(i => i.id === id);
    if (!integration) {
      console.error('❌ לא נמצאה אינטגרציה עם ID:', id);
      return;
    }
    
    console.log('👁️ פותח פרטי אינטגרציה:', integration.name);
    
    // פתיחת ה-Modal
    openIntegrationDetailsModal(integration.id, integration.name, integration.slug);
  };

  return (
    <LayoutIntegration isDarkMode={isDarkMode}>
      {/* Header & Filters Container */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className={`relative rounded-3xl p-8 backdrop-blur-md overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-purple-900/10 border border-white/[0.08]'
            : 'bg-white/70 border border-purple-200 shadow-lg'
        }`}>
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 pointer-events-none ${
            isDarkMode
              ? 'bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5'
              : 'bg-gradient-to-r from-purple-100/30 via-pink-50/20 to-purple-100/30'
          }`}></div>
          
          <div className="relative z-10">
            <IntegrationHeader 
              totalAvailable={integrations.length}
              totalConnected={connectedCount}
            />
            
            <IntegrationFilters
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalIntegrations={integrations.length}
            />
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && <LoadingState message="Loading Integrations" />}

      {/* Error State */}
      {isError && (
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className={`text-lg ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            ❌ שגיאה בטעינת הכלים
            {error?.response?.data && (
              <div className="text-sm mt-2">
                {JSON.stringify(error.response.data)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integrations Grid */}
      {!isLoading && !isError && (
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
      )}

      {/* Integration Details Modal */}
      <IntegrationDetailsModal />
    </LayoutIntegration>
  );
}

export default Integrations;

