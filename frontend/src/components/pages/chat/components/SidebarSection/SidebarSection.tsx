import useDarkModeStore from '../../../../../../store/darkmode.store';
import { getGlowClass } from '../../utils';
import { BasicSettingsSection } from './BasicSettingsSection';
import { ToolsSection } from './ToolsSection';
import { FilesSection } from './FilesSection';
import { TriggersSection } from './TriggersSection';
import type { SectionProps } from './types';

export const SidebarSection = ({
  icon,
  title,
  subtitle,
  isExpanded,
  onToggle,
  iconBgColor,
  agentName,
  setAgentName,
  agentPrompt,
  setAgentPrompt,
  onSaveSettings,
  isSaving,
  selectedFiles = [],
  onFileSelect,
  onUploadFiles,
  isUploading = false,
  uploadedFiles = [],
  onDeleteFile,
  onDownloadFile,
  isDownloading = false,
  onCreateTrigger,
  tools = [],
  onAddTool,
  onRemoveTool,
  onConnectTool,
  onDisconnectTool,
  isConnecting = false,
  connectingToolName = null,
  isDisconnecting = false,
  disconnectingToolName = null,
  isAddingTool = false,
  addingToolName = null,
  isRemovingTool = false,
  removingToolName = null,
  selectedAvatar,
  previewUrl,
  onAvatarSelect,
  agentAvatar
}: SectionProps) => {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="mb-4 mx-4">
      <div className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
        isDarkMode
          ? 'bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-purple-600/20 border-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
          : 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 border-purple-300 shadow-md'
      } ${getGlowClass(iconBgColor)}`}>
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-4 p-5 transition-all duration-200 ${
            isDarkMode
              ? 'hover:bg-gradient-to-br hover:from-purple-500/25 hover:via-pink-500/20 hover:to-purple-600/25'
              : 'hover:bg-gradient-to-br hover:from-purple-100 hover:via-pink-100 hover:to-purple-200'
          }`}
        >
          <div className={`flex-shrink-0 w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center ${
            !isDarkMode && 'border-2 border-white shadow-md'
          }`}>
            {icon}
          </div>
          <div className="flex-1 text-left">
            <h3 className={`font-semibold text-base ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </h3>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {subtitle}
            </p>
          </div>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${
              isDarkMode ? 'text-gray-400' : 'text-purple-600'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && title === 'Basic Settings' && (
          <BasicSettingsSection
            agentName={agentName}
            setAgentName={setAgentName}
            agentPrompt={agentPrompt}
            setAgentPrompt={setAgentPrompt}
            onSaveSettings={onSaveSettings}
            isSaving={isSaving}
            selectedAvatar={selectedAvatar}
            previewUrl={previewUrl}
            onAvatarSelect={onAvatarSelect}
            agentAvatar={agentAvatar}
          />
        )}
        
        {isExpanded && title === 'Tools' && (
          <ToolsSection
            tools={tools}
            onAddTool={onAddTool}
            onRemoveTool={onRemoveTool}
            onConnectTool={onConnectTool}
            onDisconnectTool={onDisconnectTool}
            isConnecting={isConnecting}
            connectingToolName={connectingToolName}
            isDisconnecting={isDisconnecting}
            disconnectingToolName={disconnectingToolName}
            isAddingTool={isAddingTool}
            addingToolName={addingToolName}
            isRemovingTool={isRemovingTool}
            removingToolName={removingToolName}
          />
        )}
        
        {isExpanded && title === 'Files' && (
          <FilesSection
            selectedFiles={selectedFiles}
            onFileSelect={onFileSelect}
            onUploadFiles={onUploadFiles}
            isUploading={isUploading}
            uploadedFiles={uploadedFiles}
            onDeleteFile={onDeleteFile}
            onDownloadFile={onDownloadFile}
            isDownloading={isDownloading}
          />
        )}
        
        {isExpanded && title === 'Triggers' && (
          <TriggersSection
            onCreateTrigger={onCreateTrigger}
          />
        )}
      </div>
    </div>
  );
};

