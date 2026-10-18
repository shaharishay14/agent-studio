import { useState } from 'react';
import useDarkModeStore from '../../../../store/darkmode.store';
import useModalsStore from '../../../../store/modals.store';
import { toast } from 'sonner';
import {
  ModalHeader,
  ModalFooter,
  ShareModalTabs,
  ShareLinkTab,
  ShareQRTab,
  ShareEmbedTab,
} from './ShareAgentModal/index';
import type { TabType } from './ShareAgentModal/index';

function ShareAgentModal() {
  const { isDarkMode } = useDarkModeStore();
  const { shareAgentModal, closeShareAgentModal } = useModalsStore();
  const [activeTab, setActiveTab] = useState<TabType>('link');

  if (!shareAgentModal.isOpen) return null;

  // Dynamic agent link based on agent ID
  const frontUrl = import.meta.env.VITE_FRONT_URL || window.location.origin;
  const agentLink = `${frontUrl}/public/chat/${shareAgentModal.agentId}`;
  
  const embedCode = `<iframe src="${agentLink}" width="100%" height="600" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);" title="Chat with ${shareAgentModal.agentName || 'Agent'}"></iframe>`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const handleClose = () => {
    setActiveTab('link');
    closeShareAgentModal();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border-2 max-h-[95vh] overflow-y-auto ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-700/50' 
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-4 sm:p-6 md:p-8">
          <ModalHeader 
            isDarkMode={isDarkMode}
            agentName={shareAgentModal.agentName || 'Agent'}
            onClose={handleClose}
          />

          <ShareModalTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isDarkMode={isDarkMode}
          />

          {/* Content */}
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 ${
            isDarkMode ? 'bg-white/[0.03]' : 'bg-gray-50'
          }`}>
            {activeTab === 'link' && (
              <ShareLinkTab 
                isDarkMode={isDarkMode}
                agentLink={agentLink}
                onCopy={handleCopy}
              />
            )}

            {activeTab === 'qr' && (
              <ShareQRTab 
                isDarkMode={isDarkMode}
                agentLink={agentLink}
              />
            )}

            {activeTab === 'embed' && (
              <ShareEmbedTab 
                isDarkMode={isDarkMode}
                embedCode={embedCode}
                onCopy={handleCopy}
              />
            )}
          </div>

          <ModalFooter isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
}

export default ShareAgentModal;
