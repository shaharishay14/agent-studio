import { useState } from 'react';
import { Code, Link, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { HaloToggleGroup } from '@/components/ui/halo-toggle-group';
import { IconCircle } from '@/components/ui/icon-circle';
import { Modal } from '@/components/ui/modal';
import useModalsStore from '../../../../store/modals.store';
import { ShareLinkTab, ShareQRTab, ShareEmbedTab } from './ShareAgentModal/index';
import type { TabType } from './ShareAgentModal/index';

const TABS = [
  { value: 'link', label: <><Link className="size-4" strokeWidth={1.7} aria-hidden="true" /> Link</> },
  { value: 'qr', label: <><QrCode className="size-4" strokeWidth={1.7} aria-hidden="true" /> QR code</> },
  { value: 'embed', label: <><Code className="size-4" strokeWidth={1.7} aria-hidden="true" /> Embed</> },
];

function ShareAgentModal() {
  const { shareAgentModal, closeShareAgentModal } = useModalsStore();
  const [activeTab, setActiveTab] = useState<TabType>('link');

  // Dynamic agent link based on agent ID
  const frontUrl = import.meta.env.VITE_FRONT_URL || window.location.origin;
  const agentLink = `${frontUrl}/public/chat/${shareAgentModal.agentId}`;
  const agentName = shareAgentModal.agentName || 'your agent';

  const embedCode = `<iframe src="${agentLink}" width="100%" height="600" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);" title="Chat with ${shareAgentModal.agentName || 'Agent'}"></iframe>`;

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied`);
    } catch {
      toast.error(`Couldn't copy the ${type.toLowerCase()}. Select it and copy it yourself.`);
    }
  };

  const handleClose = () => {
    setActiveTab('link');
    closeShareAgentModal();
  };

  return (
    <Modal
      open={shareAgentModal.isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title={`Share ${agentName}`}
      description="A public chat page. Your agent's settings and files stay private."
      icon={
        <IconCircle>
          <Share2 />
        </IconCircle>
      }
    >
      <div className="flex flex-col gap-5">
        <HaloToggleGroup
          items={TABS}
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabType)}
          aria-label="Share as"
          className="self-start"
        />
        {activeTab === 'link' && <ShareLinkTab agentLink={agentLink} onCopy={handleCopy} />}
        {activeTab === 'qr' && <ShareQRTab agentLink={agentLink} />}
        {activeTab === 'embed' && <ShareEmbedTab embedCode={embedCode} onCopy={handleCopy} />}
      </div>
    </Modal>
  );
}

export default ShareAgentModal;
