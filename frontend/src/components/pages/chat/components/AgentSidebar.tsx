import { useState, useMemo } from 'react';
import { Wrench } from 'lucide-react';
import useDarkModeStore from '../../../../../store/darkmode.store';
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
  const { isDarkMode } = useDarkModeStore();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
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
    <div className={`border-r backdrop-blur-sm flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
      isOpen ? 'w-full md:w-[420px]' : 'w-0 border-r-0'
    } ${
      isDarkMode
        ? 'border-white/[0.08] bg-gradient-to-br from-gray-900/60 via-purple-900/20 to-gray-900/70'
        : 'border-purple-300/50 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20'
    } ${
      isOpen ? 'absolute md:relative inset-0 z-50 md:z-auto' : ''
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${
        isDarkMode 
          ? 'border-white/[0.08] bg-gradient-to-r from-transparent via-purple-500/5 to-transparent' 
          : 'border-purple-200 bg-gradient-to-r from-transparent via-purple-50/30 to-transparent'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDarkMode
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                : 'bg-gradient-to-br from-purple-400 to-pink-500'
            }`}>
              <svg className={`w-5 h-5 ${
                isDarkMode ? 'text-purple-400' : 'text-white'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
              }`}>Agent Settings</h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-700'
              }`}>Configure your AI companion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-white/[0.05] text-gray-400'
                : 'hover:bg-purple-100 text-purple-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className={`flex-1 overflow-y-auto py-4 custom-scrollbar ${
        isDarkMode 
          ? 'bg-gradient-to-b from-transparent via-purple-500/3 to-transparent' 
          : 'bg-gradient-to-b from-transparent via-purple-50/20 to-transparent'
      }`}>
        <SidebarSection
          icon={
            <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="Basic Settings"
          subtitle="Name & prompt configuration"
          isExpanded={expandedSection === 'basic'}
          onToggle={() => toggleSection('basic')}
          iconBgColor="bg-purple-500/20"
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
          icon={
            <Wrench className="w-7 h-7 text-blue-400" />
          }
          title="Tools"
          subtitle="Enhance agent capabilities"
          isExpanded={expandedSection === 'tools'}
          onToggle={() => toggleSection('tools')}
          iconBgColor="bg-blue-500/20"
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
          icon={
            <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="Files"
          subtitle="Knowledge base enrichment"
          isExpanded={expandedSection === 'files'}
          onToggle={() => toggleSection('files')}
          iconBgColor="bg-green-500/20"
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
          icon={
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Triggers"
          subtitle="Automated execution"
          isExpanded={expandedSection === 'triggers'}
          onToggle={() => toggleSection('triggers')}
          iconBgColor="bg-red-500/20"
          agentName={agentName}
          setAgentName={setAgentName}
          agentPrompt={agentPrompt}
          setAgentPrompt={setAgentPrompt}
          onSaveSettings={handleSaveSettings}
          isSaving={isUpdating}
          onCreateTrigger={() => agent?.id && openCreateTriggerModal(agent.id)}
        />
      </div>

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
    </div>
  );
}

export default AgentSidebar;

