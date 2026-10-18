import { useState, useEffect } from 'react';
import useDarkModeStore from '../../../../../../store/darkmode.store';
import useModalsStore from '../../../../../../store/modals.store';
import { useCreateWorkflow, useUpdateWorkflow } from '../../hooks';
import { Sparkles, Save } from 'lucide-react';

function CreateWorkflowModal() {
  const { isDarkMode } = useDarkModeStore();
  const { createWorkflowModal, closeCreateWorkflowModal } = useModalsStore();
  const { mutate: createWorkflow, isPending: isCreating } = useCreateWorkflow();
  const { mutate: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isEditMode = createWorkflowModal.workflowId !== null;
  const isPending = isCreating || isUpdating;

  // Load data when editing
  useEffect(() => {
    if (createWorkflowModal.workflowData) {
      setName(createWorkflowModal.workflowData.name);
      setDescription(createWorkflowModal.workflowData.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [createWorkflowModal.workflowData, createWorkflowModal.isOpen]);

  if (!createWorkflowModal.isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    if (isEditMode && createWorkflowModal.workflowId) {
      // Update existing workflow
      updateWorkflow({
        id: createWorkflowModal.workflowId,
        data: {
          name: name.trim(),
          description: description.trim(),
        }
      }, {
        onSuccess: () => {
          setName('');
          setDescription('');
          closeCreateWorkflowModal();
        },
      });
    } else {
      // Create new workflow
      createWorkflow({
        name: name.trim(),
        description: description.trim(),
        status: 'draft',
      }, {
        onSuccess: () => {
          setName('');
          setDescription('');
          closeCreateWorkflowModal();
        },
      });
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    closeCreateWorkflowModal();
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
        className={`relative w-full max-w-xl rounded-3xl shadow-2xl border max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-950 via-black to-gray-950 border-gray-800/50 backdrop-blur-xl' 
            : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
        }`}
      >
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg flex-shrink-0 bg-gradient-to-br from-purple-500/60 via-pink-500/60 to-purple-600/60 shadow-md shadow-purple-500/10">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className={`text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-purple-400/80 via-pink-400/80 to-purple-400/80 bg-clip-text text-transparent`}>
                  {isEditMode ? 'Edit Workflow' : 'Create New Workflow'}
                </h2>
              </div>
            </div>
            <button
              type="button"
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

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            {/* Workflow Name */}
            <div>
              <label 
                htmlFor="workflow-name"
                className={`block text-xs sm:text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Workflow Name
              </label>
              <input
                id="workflow-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily Report Generator"
                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none text-sm sm:text-base ${
                  isDarkMode
                    ? 'bg-gray-900/80 border-gray-800/60 text-white placeholder-gray-500 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20'
                    : 'bg-gray-50/80 border-gray-300/50 text-gray-900 placeholder-gray-400 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20'
                }`}
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label 
                htmlFor="workflow-description"
                className={`block text-xs sm:text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Description
              </label>
              <textarea
                id="workflow-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this workflow does..."
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none resize-none text-sm sm:text-base ${
                  isDarkMode
                    ? 'bg-gray-900/80 border-gray-800/60 text-white placeholder-gray-500 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20'
                    : 'bg-gray-50/80 border-gray-300/50 text-gray-900 placeholder-gray-400 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20'
                }`}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className={`flex gap-3 mt-6 pt-6 border-t ${
            isDarkMode ? 'border-gray-800/60' : 'border-gray-200/50'
          }`}>
            <button
              type="button"
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
              type="submit"
              disabled={!name.trim() || isPending}
              className={`flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${
                !name.trim() || isPending
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 active:scale-95'
              }`}
            >
              {isEditMode ? <Save className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              <span className="hidden xs:inline">
                {isPending 
                  ? (isEditMode ? 'Saving...' : 'Creating...') 
                  : (isEditMode ? 'Save Changes' : 'Create Workflow')
                }
              </span>
              <span className="xs:hidden">
                {isPending 
                  ? '...' 
                  : (isEditMode ? 'Save' : 'Create')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateWorkflowModal;

