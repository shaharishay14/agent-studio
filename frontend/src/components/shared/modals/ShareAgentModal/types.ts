export type TabType = 'link' | 'qr' | 'embed';

export interface ShareLinkTabProps {
  agentLink: string;
  onCopy: (text: string, type: string) => void;
}

export interface ShareQRTabProps {
  agentLink: string;
}

export interface ShareEmbedTabProps {
  embedCode: string;
  onCopy: (text: string, type: string) => void;
}
