export type TabType = 'link' | 'qr' | 'embed';

export interface ShareModalProps {
  isDarkMode: boolean;
  agentName: string;
  agentLink: string;
}

export interface TabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDarkMode: boolean;
}

export interface ShareLinkTabProps {
  isDarkMode: boolean;
  agentLink: string;
  onCopy: (text: string, type: string) => void;
}

export interface ShareQRTabProps {
  isDarkMode: boolean;
  agentLink: string;
}

export interface ShareEmbedTabProps {
  isDarkMode: boolean;
  embedCode: string;
  onCopy: (text: string, type: string) => void;
}

export interface ModalHeaderProps {
  isDarkMode: boolean;
  agentName: string;
  onClose: () => void;
}

export interface ModalFooterProps {
  isDarkMode: boolean;
}

