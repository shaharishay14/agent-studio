import type { AgentFile, UnifiedTool } from '../../types';

export interface SectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onToggle: () => void;
  iconBgColor: string;
  agentName: string;
  setAgentName: (name: string) => void;
  agentPrompt: string;
  setAgentPrompt: (prompt: string) => void;
  onSaveSettings: () => void;
  isSaving: boolean;
  selectedFiles?: File[];
  onFileSelect?: (files: File[]) => void;
  onUploadFiles?: () => void;
  isUploading?: boolean;
  uploadedFiles?: AgentFile[];
  onDeleteFile?: (fileId: string | number, fileName: string) => void;
  onDownloadFile?: (fileId: string | number, fileName: string) => void;
  isDownloading?: boolean;
  onCreateTrigger?: () => void;
  tools?: UnifiedTool[];
  onAddTool?: (toolName: string) => void;
  onRemoveTool?: (toolName: string) => void;
  onConnectTool?: (toolName: string) => void;
  onDisconnectTool?: (toolName: string) => void;
  isConnecting?: boolean;
  connectingToolName?: string | null;
  isDisconnecting?: boolean;
  disconnectingToolName?: string | null;
  isAddingTool?: boolean;
  addingToolName?: string | null;
  isRemovingTool?: boolean;
  removingToolName?: string | null;
  selectedAvatar?: File | null;
  previewUrl?: string | null;
  onAvatarSelect?: (file: File | null) => void;
  agentAvatar?: string | null;
}

