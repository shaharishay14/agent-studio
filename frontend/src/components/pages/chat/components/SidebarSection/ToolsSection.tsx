import type { ReactNode } from 'react';
import { Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BrandIcon } from '@/components/ui/brand-icon';
import type { UnifiedTool } from '../../types';

interface ToolsSectionProps {
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
}

const ToolRow = ({ tool, children }: { tool: UnifiedTool; children: ReactNode }) => (
  <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
    <span className="grid size-9 shrink-0 place-items-center rounded-pill border border-white/25 bg-white/8 text-white" aria-hidden="true">
      <BrandIcon name={tool.tool_name.split('_')[0]} size={16} fallback={Wrench} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="m-0 truncate text-sm font-medium">{tool.name}</p>
      <p className="m-0 truncate text-xs text-white/60" title={tool.description}>
        {tool.description}
      </p>
    </div>
    <div className="flex shrink-0 gap-1.5">{children}</div>
  </li>
);

const Empty = ({ children }: { children: ReactNode }) => (
  <p className="m-0 rounded-2xl border border-dashed border-white/15 p-4 text-center text-sm text-white/60">{children}</p>
);

const listClass = 'm-0 flex max-h-[260px] list-none flex-col gap-2 overflow-y-auto p-0 pr-1';

export const ToolsSection = ({
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
  removingToolName = null
}: ToolsSectionProps) => {
  const agentTools = tools.filter(tool => tool.is_connected_to_agent);
  const availableTools = tools.filter(tool => !tool.is_connected_to_agent);

  const disconnectButton = (tool: UnifiedTool) => {
    const busy = isDisconnecting && disconnectingToolName === tool.name;
    return (
      <Button variant="glass" size="sm" className="h-8 px-3 text-xs" onClick={() => onDisconnectTool?.(tool.tool_name)} disabled={busy} loading={busy}>
        {busy ? 'Disconnecting…' : 'Disconnect'}
      </Button>
    );
  };

  const addButton = (tool: UnifiedTool) => {
    const busy = isAddingTool && addingToolName === tool.name;
    return (
      <Button size="sm" className="h-8 px-3 text-xs" onClick={() => onAddTool?.(tool.tool_name)} disabled={busy} loading={busy}>
        {busy ? 'Adding…' : 'Add'}
      </Button>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="m-0 text-sm text-white/72">The agent only uses a tool when the task calls for it.</p>

      <div className="flex flex-col gap-2.5">
        <h4 className="m-0 text-xs tracking-[0.08em] text-white/66 uppercase">On this agent</h4>
        {agentTools.length === 0 ? (
          <Empty>No tools yet. Add one below.</Empty>
        ) : (
          <ul className={listClass}>
            {agentTools.map((tool) => {
              const removing = isRemovingTool && removingToolName === tool.name;
              return (
                <ToolRow key={tool.tool_name} tool={tool}>
                  {tool.isToolRequirePremission && tool.is_connected_to_account && disconnectButton(tool)}
                  <Button variant="glass" size="sm" className="h-8 px-3 text-xs" onClick={() => onRemoveTool?.(tool.tool_name)} disabled={removing} loading={removing}>
                    {removing ? 'Removing…' : 'Remove'}
                  </Button>
                </ToolRow>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <h4 className="m-0 text-xs tracking-[0.08em] text-white/66 uppercase">Available</h4>
        {availableTools.length === 0 ? (
          <Empty>Every tool is already on this agent.</Empty>
        ) : (
          <ul className={listClass}>
            {availableTools.map((tool) => {
              const connecting = isConnecting && connectingToolName === tool.name;
              return (
                <ToolRow key={tool.tool_name} tool={tool}>
                  {tool.isToolRequirePremission && !tool.is_connected_to_account ? (
                    <Button size="sm" className="h-8 px-3 text-xs" onClick={() => onConnectTool?.(tool.tool_name)} disabled={connecting} loading={connecting}>
                      {connecting ? 'Connecting…' : 'Connect'}
                    </Button>
                  ) : tool.isToolRequirePremission && tool.is_connected_to_account ? (
                    <>
                      {disconnectButton(tool)}
                      {addButton(tool)}
                    </>
                  ) : (
                    addButton(tool)
                  )}
                </ToolRow>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
