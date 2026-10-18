import { useState, useMemo, useEffect } from 'react';
import useDarkModeStore from '../../../../../../store/darkmode.store';
import useModalsStore from '../../../../../../store/modals.store';
import { useUpdateWorkflow, useCreateAgentInWorkflow } from '../../hooks';
import { useGetWorkflows } from '../../hooks';
import { useGetAgents } from '../../../agents/hooks';
import { formatAvatarUrl } from '../../../chat/utils';
import { Plus, Search, ArrowRight } from 'lucide-react';

type TabType = 'existing' | 'new';

function AddAgentToWorkflowModal() {
  const { isDarkMode } = useDarkModeStore();
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

  // מצא את ה-workflow הנוכחי
  const currentWorkflow = useMemo(() => 
    workflows.find(w => w.id === addAgentToWorkflowModal.workflowId),
    [workflows, addAgentToWorkflowModal.workflowId]
  );

  // אם ה-workflow לא קיים יותר (נמחק), סגור את ה-modal
  useEffect(() => {
    if (addAgentToWorkflowModal.isOpen && addAgentToWorkflowModal.workflowId && !currentWorkflow) {
      closeAddAgentToWorkflowModal();
    }
  }, [addAgentToWorkflowModal.isOpen, addAgentToWorkflowModal.workflowId, currentWorkflow, closeAddAgentToWorkflowModal]);

  // קבל את ה-agents הקיימים מה-workflow (רק IDs)
  const existingAgents = useMemo(() => {
    if (currentWorkflow?.agents) {
      return currentWorkflow.agents.map(agent => agent.id);
    }
    return [];
  }, [currentWorkflow]);

  if (!addAgentToWorkflowModal.isOpen) return null;

  const filteredAgents = agents?.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSelectExistingAgent = () => {
    if (selectedAgentId && addAgentToWorkflowModal.workflowId && currentWorkflow) {
      // בדוק אם ה-agent כבר קיים
      if (existingAgents.includes(selectedAgentId)) {
        setDuplicateError(true);
        return;
      }
      
      setDuplicateError(false);
      
      // הוסף את ה-agent החדש ל-agents הקיימים
      // ודא שכל ה-agents הם רק IDs (strings)
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
        onError: (error: any) => {
          // בדוק אם זו שגיאת duplicate_agent
          const errorData = error?.response?.data;
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
        onError: (error: any) => {
          // בדוק אם זו שגיאת duplicate_agent
          const errorData = error?.response?.data;
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-2xl rounded-3xl shadow-2xl border max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-950 via-black to-gray-950 border-gray-800/50 backdrop-blur-xl' 
            : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
        }`}
      >
        <div className="p-5 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg flex-shrink-0 bg-gradient-to-br from-purple-500/60 via-pink-500/60 to-purple-600/60 shadow-md shadow-purple-500/10">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className={`text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-purple-400/80 via-pink-400/80 to-purple-400/80 bg-clip-text text-transparent`}>
                  Add Agent to Workflow
                </h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-xl transition-all flex-shrink-0 hover:scale-110 ${
                isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex gap-1.5 mb-4 p-0.5 rounded-xl ${
            isDarkMode ? 'bg-gray-900/60' : 'bg-gray-800/30'
          }`}>
            <button
              onClick={() => {
                setActiveTab('existing');
                setDuplicateError(false);
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm relative ${
                activeTab === 'existing'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="hidden xs:inline">Select Existing</span>
              <span className="xs:hidden">Existing</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('new');
                setDuplicateError(false);
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm relative ${
                activeTab === 'new'
                  ? 'bg-gradient-to-r from-purple-500 to-orange-500 text-white shadow-lg shadow-orange-500/50 scale-105'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="hidden xs:inline">Create New</span>
              <span className="xs:hidden">New</span>
            </button>
          </div>

          {/* Duplicate Error Message */}
          {duplicateError && (
            <div className={`mb-6 p-4 rounded-xl border animate-in slide-in-from-top-2 ${
              isDarkMode
                ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow-lg shadow-red-500/10'
                : 'bg-red-50/90 border-red-300/50 text-red-700 shadow-lg shadow-red-500/5'
            }`}>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-bold text-base mb-1">Cannot add duplicate agent</p>
                  <p className="text-sm opacity-90">
                    You cannot add the same agent twice to the workflow.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="min-h-0 sm:min-h-[400px]">
            {activeTab === 'existing' ? (
              <div>
                {/* Search Bar */}
                <div className="mb-3 relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search agents..."
                    className={`w-full pl-10 pr-3 py-2.5 rounded-lg border transition-all outline-none text-xs sm:text-sm ${
                      isDarkMode
                        ? 'bg-gray-900/80 border-gray-800/60 text-white placeholder-gray-500 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20'
                        : 'bg-gray-50/80 border-gray-300/50 text-gray-900 placeholder-gray-400 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20'
                    }`}
                  />
                </div>

                {/* Agents List */}
                <div className="space-y-3 max-h-[200px] sm:max-h-[360px] overflow-y-auto custom-scrollbar pr-2">
                  {isLoadingAgents ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className={`mt-4 text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading agents...
                      </p>
                    </div>
                  ) : filteredAgents.length === 0 ? (
                    <div className="text-center py-12">
                      <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {searchQuery ? 'No agents found' : 'No agents available'}
                      </p>
                    </div>
                  ) : (
                    filteredAgents.map((agent) => {
                      const avatarUrl = formatAvatarUrl(agent.avatar_base64);
                      const isSelected = selectedAgentId === agent.id;
                      return (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setSelectedAgentId(agent.id);
                            setDuplicateError(false);
                          }}
                          className={`w-full p-4 rounded-xl border transition-all duration-300 text-left group ${
                            isSelected
                              ? isDarkMode
                                ? 'border-purple-500/80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/20 scale-[1.02]'
                                : 'border-purple-500/80 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg shadow-purple-500/10 scale-[1.02]'
                              : isDarkMode
                                ? 'border-gray-800/60 bg-gray-900/60 hover:border-purple-500/50 hover:bg-gray-900/80 hover:scale-[1.01]'
                                : 'border-gray-200/50 bg-white/60 hover:border-purple-300/50 hover:bg-gray-50/80 hover:scale-[1.01]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {avatarUrl ? (
                              <div className="flex-shrink-0 relative">
                                <img 
                                  src={avatarUrl} 
                                  alt={agent.name}
                                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-purple-500/30 group-hover:border-purple-500/60 transition-all"
                                />
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                                )}
                              </div>
                            ) : (
                              <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all ${
                                isDarkMode
                                  ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/30 group-hover:border-purple-500/60'
                                  : 'bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200 group-hover:border-purple-300'
                              }`}>
                                <span className="text-2xl sm:text-3xl">🤖</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-bold mb-1.5 text-base sm:text-lg ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {agent.name}
                              </h3>
                              <p className={`text-xs sm:text-sm line-clamp-2 leading-relaxed ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {agent.prompt}
                              </p>
                            </div>
                            {isSelected && (
                              <ArrowRight className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-purple-500 animate-in slide-in-from-right-2" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div>
                {/* Create New Agent Form */}
                <div className={`border rounded-2xl p-6 bg-gradient-to-br ${
                  isDarkMode
                    ? 'border-purple-500/30 from-gray-900/80 via-gray-950/80 to-gray-900/80'
                    : 'border-purple-300/50 from-purple-50 via-pink-50 to-purple-50'
                }`}>
                  <label 
                    htmlFor="agent-prompt"
                    className={`block text-sm font-bold mb-3 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}
                  >
                    Build an agent that can extract key information from documents
                  </label>
                  <textarea
                    id="agent-prompt"
                    value={newAgentPrompt}
                    onChange={(e) => {
                      setNewAgentPrompt(e.target.value);
                      setDuplicateError(false);
                    }}
                    placeholder="Describe what your agent should do..."
                    rows={6}
                    className={`w-full px-4 py-3.5 rounded-xl border transition-all outline-none resize-none text-sm sm:text-base ${
                      isDarkMode
                        ? 'bg-gray-900/80 border-gray-800/60 text-white placeholder-gray-500 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20'
                        : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-400 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20'
                    }`}
                  />
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                      isDarkMode
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    }`}>
                      ⚡ YOLO
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className={`flex gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t ${
            isDarkMode ? 'border-gray-800/60' : 'border-gray-700/30'
          }`}>
            <button
              onClick={handleClose}
              disabled={isPending}
              className={`flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                isDarkMode
                  ? 'bg-gray-900/80 hover:bg-gray-800/90 text-gray-300 hover:scale-105'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              Cancel
            </button>
            <button
              onClick={activeTab === 'existing' ? handleSelectExistingAgent : handleCreateNewAgent}
              disabled={
                isPending || 
                (activeTab === 'existing' ? !selectedAgentId : !newAgentPrompt.trim())
              }
              className={`flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${
                isPending || (activeTab === 'existing' ? !selectedAgentId : !newAgentPrompt.trim())
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 active:scale-95'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
              <span className="hidden xs:inline">
                {isPending 
                  ? (activeTab === 'new' ? 'Creating...' : 'Adding...') 
                  : (activeTab === 'new' ? 'Create Agent' : 'Add Agent')
                }
              </span>
              <span className="xs:hidden">
                {isPending 
                  ? '...' 
                  : (activeTab === 'new' ? 'Create' : 'Add')
                }
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddAgentToWorkflowModal;

