import { useState, useMemo, useEffect } from 'react';
import { Check, Plus, Search, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HaloToggleGroup } from '@/components/ui/halo-toggle-group';
import { IconCircle } from '@/components/ui/icon-circle';
import { Modal } from '@/components/ui/modal';
import { PillInput } from '@/components/ui/pill-input';
import { Spinner } from '@/components/ui/spinner';
import { TextArea } from '@/components/ui/text-area';
import { AgentAvatar } from '../../../../sky/AgentAvatar';
import useModalsStore from '../../../../../../store/modals.store';
import { useUpdateWorkflow, useCreateAgentInWorkflow } from '../../hooks';
import { useGetWorkflows } from '../../hooks';
import { useGetAgents } from '../../../agents/hooks';

type TabType = 'existing' | 'new';

type DuplicateError = { response?: { data?: { agents?: { error?: string } } } };

const TABS = [
  { value: 'existing', label: 'Your agents' },
  { value: 'new', label: 'New agent' },
];

function AddAgentToWorkflowModal() {
  const { addAgentToWorkflowModal, closeAddAgentToWorkflowModal } = useModalsStore();
  const { mutate: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow();
  const { mutate: createAgentInWorkflow, isPending: isCreatingAgent } = useCreateAgentInWorkflow();
  const { workflows } = useGetWorkflows();
  const { agents = [], isLoading: isLoadingAgents } = useGetAgents();
  
  const [activeTab, setActiveTab] = useState<TabType>('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [newAgentPrompt, setNewAgentPrompt] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);

  const isPending = isUpdating || isCreatingAgent;

  // The workflow this modal is for
  const currentWorkflow = useMemo(() => 
    workflows.find(w => w.id === addAgentToWorkflowModal.workflowId),
    [workflows, addAgentToWorkflowModal.workflowId]
  );

  // Close if the workflow no longer exists (it was deleted)
  useEffect(() => {
    if (addAgentToWorkflowModal.isOpen && addAgentToWorkflowModal.workflowId && !currentWorkflow) {
      closeAddAgentToWorkflowModal();
    }
  }, [addAgentToWorkflowModal.isOpen, addAgentToWorkflowModal.workflowId, currentWorkflow, closeAddAgentToWorkflowModal]);

  // IDs of the agents already in the workflow
  const existingAgents = useMemo(() => {
    if (currentWorkflow?.agents) {
      return currentWorkflow.agents.map(agent => agent.id);
    }
    return [];
  }, [currentWorkflow]);

  const filteredAgents = agents?.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSelectExistingAgent = () => {
    if (selectedAgentId && addAgentToWorkflowModal.workflowId && currentWorkflow) {
      // Already in the workflow?
      if (existingAgents.includes(selectedAgentId)) {
        setDuplicateError(true);
        return;
      }
      
      setDuplicateError(false);
      
      // Append the new agent; keep only non-empty string IDs
      const updatedAgents = [...existingAgents, selectedAgentId].filter(
        (id): id is string => typeof id === 'string' && id.length > 0
      );
      
      updateWorkflow({
        id: addAgentToWorkflowModal.workflowId,
        data: { 
          agents: updatedAgents
        }
      }, {
        onSuccess: () => {
          closeAddAgentToWorkflowModal();
          setSelectedAgentId(null);
          setSearchQuery('');
          setDuplicateError(false);
        },
        onError: (error: unknown) => {
          // The backend rejects duplicates with duplicate_agent
          const errorData = (error as DuplicateError)?.response?.data;
          if (errorData?.agents?.error === 'duplicate_agent') {
            setDuplicateError(true);
          }
        },
      });
    }
  };

  const handleCreateNewAgent = () => {
    if (!newAgentPrompt.trim() || !addAgentToWorkflowModal.workflowId || !currentWorkflow) {
      return;
    }

    setDuplicateError(false);

    createAgentInWorkflow(
      {
        id: addAgentToWorkflowModal.workflowId,
        data: { prompt: newAgentPrompt.trim() }
      },
      {
        onSuccess: () => {
          closeAddAgentToWorkflowModal();
          setNewAgentPrompt('');
          setDuplicateError(false);
        },
        onError: (error: unknown) => {
          // The backend rejects duplicates with duplicate_agent
          const errorData = (error as DuplicateError)?.response?.data;
          if (errorData?.agents?.error === 'duplicate_agent') {
            setDuplicateError(true);
          }
        },
      }
    );
  };

  const handleClose = () => {
    setSelectedAgentId(null);
    setSearchQuery('');
    setNewAgentPrompt('');
    setActiveTab('existing');
    setDuplicateError(false);
    closeAddAgentToWorkflowModal();
  };

  const canSubmit = activeTab === 'existing' ? !!selectedAgentId : !!newAgentPrompt.trim();

  return (
    <Modal
      open={addAgentToWorkflowModal.isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title="Add a step"
      description={currentWorkflow ? `Add an agent to ${currentWorkflow.name}.` : undefined}
      icon={
        <IconCircle>
          <Plus />
        </IconCircle>
      }
      size="lg"
      dismissible={!isPending}
      footer={
        <>
          <Button variant="glass" size="sm" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={activeTab === 'existing' ? handleSelectExistingAgent : handleCreateNewAgent}
            disabled={!canSubmit}
            loading={isPending}
          >
            {isPending ? (activeTab === 'new' ? 'Creating…' : 'Adding…') : activeTab === 'new' ? 'Create and add' : 'Add agent'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <HaloToggleGroup
          items={TABS}
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as TabType);
            setDuplicateError(false);
          }}
          aria-label="Add an existing agent or create a new one"
          className="self-start"
        />

        {duplicateError && (
          <p className="m-0 flex items-start gap-2 rounded-2xl border border-off/40 bg-off/10 px-4 py-3 text-sm text-off" role="alert">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
            This agent is already in the workflow. Each agent can only be added once.
          </p>
        )}

        {activeTab === 'existing' ? (
          <div className="flex flex-col gap-3">
            <PillInput
              icon={<Search />}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your agents"
              aria-label="Search your agents"
            />

            <div className="flex max-h-[min(360px,45dvh)] flex-col gap-2 overflow-y-auto pr-1" aria-busy={isLoadingAgents || undefined}>
              {isLoadingAgents ? (
                <div className="flex items-center justify-center gap-3 py-10 text-sm text-white/66">
                  <Spinner size={18} />
                  Loading agents…
                </div>
              ) : filteredAgents.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-white/66">
                  {searchQuery ? `No agents match “${searchQuery}”.` : 'You have no agents yet. Create one in the other tab.'}
                </p>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  const isInWorkflow = existingAgents.includes(agent.id);
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        setSelectedAgentId(agent.id);
                        setDuplicateError(false);
                      }}
                      disabled={isInWorkflow}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-inner border p-3 text-left transition-colors duration-150',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-55',
                        isSelected
                          ? 'border-white/60 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : 'border-white/12 bg-white/[0.03] hover:border-white/30'
                      )}
                    >
                      <AgentAvatar id={agent.id} avatar={agent.avatar_base64} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-white">{agent.name}</span>
                        <span className="line-clamp-1 text-[13px] text-white/60">{agent.prompt}</span>
                      </span>
                      {isInWorkflow ? (
                        <Badge dim>In workflow</Badge>
                      ) : (
                        isSelected && <Check className="size-5 shrink-0 text-white" strokeWidth={1.8} aria-hidden="true" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <TextArea
            label="What should the new agent do?"
            value={newAgentPrompt}
            onChange={(e) => {
              setNewAgentPrompt(e.target.value);
              setDuplicateError(false);
            }}
            placeholder="e.g. Pull the key facts out of each document and list them as bullet points"
            rows={6}
            helper="It's created in one step (YOLO) and added at the end of the workflow."
            autoFocus
          />
        )}
      </div>
    </Modal>
  );
}

export default AddAgentToWorkflowModal;
