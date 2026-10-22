import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { BasicSettingsSection } from './BasicSettingsSection';
import { ToolsSection } from './ToolsSection';
import { FilesSection } from './FilesSection';
import { TriggersSection } from './TriggersSection';
import type { SectionProps } from './types';

// One accordion item in the agent settings drawer
export const SidebarSection = ({
  icon,
  title,
  subtitle,
  isExpanded,
  onToggle,
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
  const panelId = useId();

  return (
    <section
      className={cn(
        'rounded-inner border bg-white/[0.03] transition-colors duration-200',
        isExpanded ? 'border-white/25 bg-white/[0.05]' : 'border-white/12 hover:border-white/22'
      )}
    >
      <h3 className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className="flex w-full items-center gap-3.5 rounded-inner p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span
            className="grid size-10 shrink-0 place-items-center rounded-pill border border-white/30 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] [&_svg]:size-[18px] [&_svg]:stroke-[1.7]"
            aria-hidden="true"
          >
            {icon}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold">{title}</span>
            <span className="truncate text-[13px] font-normal text-white/60">{subtitle}</span>
          </span>
          <ChevronDown
            className={cn('size-4 shrink-0 text-white/70 transition-transform duration-250', isExpanded && 'rotate-180')}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>
      </h3>

      {isExpanded && (
        <div id={panelId} className="animate-sky-in border-t border-white/10 p-4">
          {title === 'Basics' && (
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

          {title === 'Tools' && (
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

          {title === 'Files' && (
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

          {title === 'Triggers' && <TriggersSection onCreateTrigger={onCreateTrigger} />}
        </div>
      )}
    </section>
  );
};
