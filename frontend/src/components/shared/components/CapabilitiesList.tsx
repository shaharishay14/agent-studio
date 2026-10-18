import { Zap, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export interface Capability {
  id: string;
  name: string;
  icon: string | React.ReactNode;
  description: string;
  connected: boolean;
  requiresConnection?: boolean;
  onConnect?: () => void;
}

interface CapabilitiesListProps {
  capabilities: Capability[];
  showTitle?: boolean;
  infoMessage?: string;
}

export const CapabilitiesList = ({
  capabilities,
  showTitle = true,
  infoMessage,
}: CapabilitiesListProps) => {
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = async (capability: Capability) => {
    if (capability.onConnect) {
      setConnectingId(capability.id);
      try {
        await capability.onConnect();
      } finally {
        setConnectingId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      {showTitle && (
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="text-xl font-semibold text-white">Capabilities</h3>
        </div>
      )}

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {capabilities.map((capability) => (
          <div
            key={capability.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Icon & Content */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center">
                  {typeof capability.icon === 'string' ? (
                    <span className="text-2xl">{capability.icon}</span>
                  ) : (
                    capability.icon
                  )}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium mb-1 truncate">
                    {capability.name}
                  </h4>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                    {capability.description}
                  </p>
                </div>
              </div>

              {/* Connect Button */}
              {capability.requiresConnection && !capability.connected && (
                <button
                  onClick={() => handleConnect(capability)}
                  disabled={connectingId === capability.id}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>
                    {connectingId === capability.id ? 'Connecting...' : 'Connect'}
                  </span>
                </button>
              )}

              {/* Connected Badge */}
              {capability.connected && (
                <div className="flex-shrink-0 px-3 py-1.5 bg-green-600/20 text-green-400 text-xs font-medium rounded-md border border-green-600/30">
                  Connected
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info Message */}
      {infoMessage && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-300 text-sm leading-relaxed">
            {infoMessage}
          </p>
        </div>
      )}
    </div>
  );
};

