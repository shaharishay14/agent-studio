import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, FileText, UserRound, Wrench, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/button';
import useModalsStore from '../../../../../store/modals.store';
import { useUpdateAgent, useGetAgentFiles, useUploadFiles, useDeleteFile, useDownloadFile, useGetAvailableAgentTools, useAddAgentTool, useRemoveAgentTool } from '../hooks';
import { useConnectTool, useDisconnectTool } from '../../integrations/hooks';
import { mapUnifiedToolsToIntegrations } from '../utils';
import { DeleteFileModal } from './modals';
import { SidebarSection } from './SidebarSection';
import type { Agent } from '../types';
import type { Integration } from '../../integrations/components/types';

interface AgentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent;
}

function AgentSidebar({ isOpen, onClose, agent }: AgentSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Move focus into the drawer when it opens
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [addingToolName, setAddingToolName] = useState<string | null>(null);
  const [isRemovingTool, setIsRemovingTool] = useState(false);
  const [removingToolName, setRemovingToolName] = useState<string | null>(null);

  const { isUpdating, agentName, setAgentName, agentPrompt, setAgentPrompt, handleSaveSettings, updateAgentAsync, selectedAvatar, previewUrl, handleAvatarSelect } = useUpdateAgent(agent?.id || '', agent);

  // Files hooks
  const { uploadedFiles } = useGetAgentFiles(agent?.id, expandedSection === 'files');
  const { selectedFiles, handleFileSelect, handleUploadFiles, isUploading } = useUploadFiles(agent?.id);
  const { handleDeleteFile, confirmDelete, isDeleting } = useDeleteFile(agent?.id);
  const { handleDownloadFile, isDownloading } = useDownloadFile();
  
  // Tools hooks
  const { data: tools } = useGetAvailableAgentTools(agent?.id || '');
  // handlers for CRUD tools
  const addAgentToolMutation = useAddAgentTool(agent?.id || '');
  const removeAgentToolMutation = useRemoveAgentTool(agent?.id || '');
  
  // המרת tools ל-integrations עבור useConnectTool
  const integrationsFromTools = useMemo<Integration[]>(() => {
    if (!tools) return [];
    return mapUnifiedToolsToIntegrations(tools);
  }, [tools]);

  const { connectTool:handleConnectTool, isConnecting, connectingToolName } = useConnectTool(integrationsFromTools);
  const { disconnectTool:handleDisconnectTool, isDisconnecting, disconnectingToolName } = useDisconnectTool(integrationsFromTools);
  
  
  // Modal state
  const { deleteFileModal, closeDeleteFileModal, openCreateTriggerModal } = useModalsStore();

  const handleAddTool = async (toolName: string) => {
    // מציאת הכלי כדי לבדוק אם הוא דורש הרשאה
    const tool = tools?.find(t => t.tool_name === toolName);
    
    if (!tool) {
      console.error('Tool not found:', toolName);
      return;
    }

    setIsAddingTool(true);
    setAddingToolName(tool.name);

    try {
      if (tool.isToolRequirePremission) {
        await updateAgentAsync({ app_connections: [...(agent?.app_connections || []), tool.tool_name] });
      } else {
        await addAgentToolMutation.mutateAsync({ tool_name: toolName });
      }
    } finally {
      setIsAddingTool(false);
      setAddingToolName(null);
    }
  };

  const handleRemoveToolWrapper = async (toolName: string) => {
    // מציאת הכלי כדי לבדוק אם הוא דורש הרשאה
    const tool = tools?.find(t => t.tool_name === toolName);
    
    if (!tool) {
      console.error('Tool not found:', toolName);
      return;
    }

    setIsRemovingTool(true);
    setRemovingToolName(tool.name);

    try {
      const newAppConnections = agent?.app_connections?.filter(connection => connection !== tool.tool_name) || [];
      // אם הכלי דורש הרשאה - גם מסירים אותו מ-app_connections
      if (tool.isToolRequirePremission) {
        await updateAgentAsync({ app_connections: newAppConnections });
      } else {
        await removeAgentToolMutation.mutateAsync(toolName);
      }
    } finally {
      setIsRemovingTool(false);
      setRemovingToolName(null);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <>
      {/* Backdrop below xl, where the drawer slides over the chat */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close agent settings"
          tabIndex={-1}
          onClick={onClose}
          className="fixed inset-0 z-40 animate-sky-in bg-night/60 backdrop-blur-[2px] xl:hidden"
        />
      )}
      <aside
        id="agent-settings"
        ref={panelRef}
        aria-label="Agent settings"
        tabIndex={-1}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-white/12 bg-night-2 outline-none sm:w-[440px]',
          'xl:static xl:z-auto xl:w-[420px] xl:shrink-0',
          isOpen ? 'animate-sky-in' : 'hidden'
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 flex-col">
            <h2 className="m-0 font-display text-xl leading-7 font-medium tracking-[-0.02em]">
              Agent <em className="sky-serif">settings</em>
            </h2>
            <p className="m-0 truncate text-[13px] text-white/60">{agent?.name}</p>
          </div>
          <IconButton aria-label="Close agent settings" onClick={onClose} className="ml-auto">
            <X />
          </IconButton>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          <SidebarSection
            icon={<UserRound />}
            title="Basics"
            subtitle="Name, picture and instructions"
            isExpanded={expandedSection === 'basic'}
            onToggle={() => toggleSection('basic')}
            agentName={agentName}
            setAgentName={setAgentName}
            agentPrompt={agentPrompt}
            setAgentPrompt={setAgentPrompt}
            onSaveSettings={handleSaveSettings}
            isSaving={isUpdating}
            selectedAvatar={selectedAvatar}
            previewUrl={previewUrl}
            onAvatarSelect={handleAvatarSelect}
            agentAvatar={agent?.avatar_base64 || null}
          />

          <SidebarSection
            icon={<Wrench />}
            title="Tools"
            subtitle="Apps and tools the agent can use"
            isExpanded={expandedSection === 'tools'}
            onToggle={() => toggleSection('tools')}
            agentName={agentName}
            setAgentName={setAgentName}
            agentPrompt={agentPrompt}
            setAgentPrompt={setAgentPrompt}
            onSaveSettings={handleSaveSettings}
            isSaving={isUpdating}
            tools={tools}
            onAddTool={handleAddTool}
            onRemoveTool={handleRemoveToolWrapper}
            onConnectTool={handleConnectTool}
            onDisconnectTool={handleDisconnectTool}
            isConnecting={isConnecting}
            connectingToolName={connectingToolName}
            isDisconnecting={isDisconnecting}
            disconnectingToolName={disconnectingToolName}
            isAddingTool={isAddingTool}
            addingToolName={addingToolName}
            isRemovingTool={isRemovingTool}
            removingToolName={removingToolName}
          />

          <SidebarSection
            icon={<FileText />}
            title="Files"
            subtitle="Documents the agent reads"
            isExpanded={expandedSection === 'files'}
            onToggle={() => toggleSection('files')}
            agentName={agentName}
            setAgentName={setAgentName}
            agentPrompt={agentPrompt}
            setAgentPrompt={setAgentPrompt}
            onSaveSettings={handleSaveSettings}
            isSaving={isUpdating}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onUploadFiles={handleUploadFiles}
            isUploading={isUploading}
            uploadedFiles={uploadedFiles}
            onDeleteFile={handleDeleteFile}
            onDownloadFile={handleDownloadFile}
            isDownloading={isDownloading}
          />

          <SidebarSection
            icon={<Clock />}
            title="Triggers"
            subtitle="Run on a schedule or an app event"
            isExpanded={expandedSection === 'triggers'}
            onToggle={() => toggleSection('triggers')}
            agentName={agentName}
            setAgentName={setAgentName}
            agentPrompt={agentPrompt}
            setAgentPrompt={setAgentPrompt}
            onSaveSettings={handleSaveSettings}
            isSaving={isUpdating}
            onCreateTrigger={() => agent?.id && openCreateTriggerModal(agent.id)}
          />
        </div>
      </aside>

      {/* Delete File Modal */}
      <DeleteFileModal
        isOpen={deleteFileModal.isOpen}
        fileName={deleteFileModal.fileName || ''}
        onConfirm={() => {
          if (deleteFileModal.fileId) {
            confirmDelete(deleteFileModal.fileId);
          }
        }}
        onCancel={closeDeleteFileModal}
        isDeleting={isDeleting}
      />
    </>
  );
}

export default AgentSidebar;
