import type { Integration } from './types';
import IntegrationCard from './IntegrationCard';
import useDarkModeStore from '../../../../../store/darkmode.store';

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

function IntegrationGrid({ integrations, onConnect, onDisconnect, onViewDetails, isConnecting, connectingToolName, isDisconnecting, disconnectingToolName }: IntegrationGridProps) {
  const { isDarkMode } = useDarkModeStore();
  
  // חלוקה לאינטגרציות מחוברות ולא מחוברות
  const connectedIntegrations = integrations.filter(i => i.isConnected);
  const notConnectedIntegrations = integrations.filter(i => !i.isConnected);
  
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Connected Section */}
      {connectedIntegrations.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <h2 className={`text-xs font-bold tracking-wider uppercase ${
              isDarkMode ? 'text-green-500' : 'text-green-700'
            }`}>
              CONNECTED
            </h2>
            <span className={`text-xs px-3 py-1 rounded-full ${
              isDarkMode
                ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                : 'text-green-700 bg-green-100 border border-green-300'
            }`}>
              {connectedIntegrations.length}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectedIntegrations.map((integration) => (
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
        </div>
      )}
      
      {/* Not Connected Section */}
      {notConnectedIntegrations.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <h2 className={`text-xs font-bold tracking-wider uppercase ${
              isDarkMode ? 'text-gray-500' : 'text-purple-700'
            }`}>
              NOT CONNECTED
            </h2>
            <span className={`text-xs px-3 py-1 rounded-full ${
              isDarkMode
                ? 'text-gray-600 bg-white/5'
                : 'text-purple-700 bg-purple-100 border border-purple-300'
            }`}>
              {notConnectedIntegrations.length}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notConnectedIntegrations.map((integration) => (
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
        </div>
      )}
      
      {/* Empty State */}
      {integrations.length === 0 && (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          לא נמצאו אינטגרציות
        </div>
      )}
    </div>
  );
}

export default IntegrationGrid;

