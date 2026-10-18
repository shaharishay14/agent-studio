import { Workflow as WorkflowIcon, Plus, X } from 'lucide-react';
import type { Workflow } from '../types';
import WorkflowCard from './WorkflowCard';
import useDarkModeStore from '../../../../../store/darkmode.store';

interface WorkflowSidebarProps {
  workflows: Workflow[];
  selectedWorkflowId: number | null;
  onSelectWorkflow: (id: number) => void;
  onCreateWorkflow: () => void;
  onEditWorkflow: (id: number) => void;
  onDeleteWorkflow: (id: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

function WorkflowSidebar({
  workflows,
  selectedWorkflowId,
  onSelectWorkflow,
  onCreateWorkflow,
  onEditWorkflow,
  onDeleteWorkflow,
  onClose,
  isOpen,
}: WorkflowSidebarProps) {
  const { isDarkMode } = useDarkModeStore();
  
  return (
    <div className={`border-r backdrop-blur-sm flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
      isOpen ? 'w-full md:w-[380px]' : 'w-0 border-r-0'
    } ${
      isDarkMode
        ? 'border-white/[0.08] bg-gradient-to-b from-gray-900/50 to-gray-900/80'
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDarkMode
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                : 'bg-purple-100 border border-purple-200'
            }`}>
              <WorkflowIcon className={`w-6 h-6 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent pb-1'
            }`}>Workflows</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-white/[0.05] text-gray-400'
                : 'hover:bg-purple-100 text-purple-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Workflow Button */}
        <button
          onClick={onCreateWorkflow}
          className={`w-full py-3 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 rounded-xl text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
            isDarkMode ? 'shadow-purple-500/25 hover:shadow-purple-500/40' : 'shadow-purple-500/30 hover:shadow-purple-500/50'
          }`}
        >
          <Plus className="w-5 h-5" />
          New Workflow
          <WorkflowIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Workflows List */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${
        isDarkMode 
          ? 'bg-gradient-to-b from-transparent via-purple-500/3 to-transparent' 
          : 'bg-gradient-to-b from-transparent via-purple-50/20 to-transparent'
      }`}>
        {workflows.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isDarkMode ? 'bg-white/[0.05]' : 'bg-purple-100 border border-purple-200'
            }`}>
              <WorkflowIcon className={`w-8 h-8 ${
                isDarkMode ? 'text-gray-500' : 'text-purple-600'
              }`} />
            </div>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>No workflows yet</p>
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>Create your first workflow to get started</p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              isSelected={selectedWorkflowId === workflow.id}
              onSelect={onSelectWorkflow}
              onEdit={onEditWorkflow}
              onDelete={onDeleteWorkflow}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default WorkflowSidebar;

