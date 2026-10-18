import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Workflow } from '../types';
import useDarkModeStore from '../../../../../store/darkmode.store';
import useModalsStore from '../../../../../store/modals.store';

interface WorkflowCardProps {
  workflow: Workflow;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function WorkflowCard({ workflow, isSelected, onSelect, onEdit, onDelete }: WorkflowCardProps) {
  const { isDarkMode } = useDarkModeStore();
  const { openCreateTriggerModalForWorkflow } = useModalsStore();
  const [isTriggersExpanded, setIsTriggersExpanded] = useState(false);
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(workflow.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(workflow.id);
  };

  const handleExpandTriggers = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTriggersExpanded(!isTriggersExpanded);
  };

  const handleCreateTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCreateTriggerModalForWorkflow(workflow.id);
  };

  return (
    <div 
      onClick={() => onSelect(workflow.id)}
      className={`
        relative rounded-2xl p-5 
        border-2 transition-all duration-300 cursor-pointer group overflow-hidden
        ${isSelected 
          ? isDarkMode
            ? 'border-purple-500/60 bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-purple-900/40 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
            : 'border-purple-400/60 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
          : isDarkMode
            ? 'bg-gradient-to-br from-purple-900/20 via-pink-900/15 to-purple-900/20 border-gray-800/40 hover:border-purple-500/40 hover:bg-gradient-to-br hover:from-purple-900/30 hover:via-pink-900/20 hover:to-purple-900/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
            : 'bg-gradient-to-br from-white via-purple-50/50 to-pink-50/30 border-gray-200/50 hover:border-purple-300/50 hover:bg-gradient-to-br hover:from-white hover:via-purple-50 hover:to-pink-50 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]'
        }
      `}
    >
      {/* Header with Icon, Title and Action Buttons */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${
          isDarkMode
            ? 'from-purple-500/30 via-pink-500/30 to-purple-600/30'
            : 'from-purple-200 via-pink-200 to-purple-300'
        }`}>
          <svg className={`w-3.5 h-3.5 ${
            isDarkMode ? 'text-purple-300' : 'text-purple-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`text-base font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {workflow.name}
            </h3>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={handleEdit}
                className={`p-1.5 rounded-lg transition-all ${
                  isDarkMode
                    ? 'hover:bg-white/[0.08] text-gray-400 hover:text-gray-300'
                    : 'hover:bg-purple-100 text-gray-500 hover:text-purple-700'
                }`}
                aria-label="Edit workflow"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all text-gray-400 hover:text-red-400"
                aria-label="Delete workflow"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className={`text-sm line-clamp-2 leading-relaxed ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {workflow.description}
          </p>
        </div>
      </div>

      {/* Status Tags */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`
          px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5
          ${workflow.status === 'active' || workflow.status === 'draft'
            ? isDarkMode
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-green-100 text-green-700 border border-green-300'
            : isDarkMode
              ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }
        `}>
          {(workflow.status === 'active' || workflow.status === 'draft') && (
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          )}
          {workflow.status === 'draft' ? 'active' : workflow.status}
        </span>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
          isDarkMode
            ? 'bg-gray-700/40 text-gray-300 border border-gray-600/40'
            : 'bg-purple-100 text-purple-700 border border-purple-200'
        }`}>
          {workflow.nodes} steps
        </span>
      </div>

      <div>
        <button
          onClick={handleExpandTriggers}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
            isDarkMode
              ? 'bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/30'
              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 ${
              isDarkMode ? 'text-orange-400' : 'text-orange-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Triggers</span>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${
              isTriggersExpanded ? 'rotate-90' : ''
            } ${isDarkMode ? 'text-gray-400' : 'text-purple-600'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Expanded Triggers Section */}
        {isTriggersExpanded && (
          <div 
            className={`mt-3 p-4 rounded-xl border ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/[0.05]'
                : 'bg-purple-50/50 border-purple-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`text-sm mb-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>
              Set up automated triggers to execute your workflow on a schedule.
            </div>
            
            <button
              onClick={handleCreateTrigger}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Trigger
            </button>

            <div className="text-center py-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                isDarkMode ? 'bg-white/[0.05]' : 'bg-purple-100'
              }`}>
                <svg className={`w-8 h-8 ${
                  isDarkMode ? 'text-gray-500' : 'text-purple-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className={`text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                No triggers configured
              </p>
              <p className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
                Create your first trigger to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkflowCard;

