import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IconCircle } from '@/components/ui/icon-circle';
import { Modal } from '@/components/ui/modal';
import { WizardSteps } from '@/components/ui/wizard-steps';
import { BasicInfoStep, ToolSelectionStep, FileUploadStep, TriggersStep } from './components';
import { useGetConnectionsForDisplay } from '../../../integrations/hooks/useGetConnectionsForDisplay';
import { useCreateAgent } from '../../hooks/useCreateAgent';

interface ManualAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: ManualAgentData) => void;
  initialPrompt?: string;
}

export interface ManualAgentData {
  name: string;
  prompt: string;
  avatar?: File | null;
  tools?: string[];
  files?: File[];
  triggers?: unknown[];
}

type Step = 1 | 2 | 3 | 4;

const STEPS = ['Basics', 'Apps', 'Files', 'Triggers'];

function ManualAgentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialPrompt = ''
}: ManualAgentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const { createAgent, isCreating } = useCreateAgent();
  
  // Form data
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [triggers] = useState<unknown[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { connectionsForDisplay, isLoading: isLoadingTools } = useGetConnectionsForDisplay();

  // Filter tools based on search
  const filteredTools = useMemo(() => {
    if (!connectionsForDisplay || connectionsForDisplay.length === 0) return [];
    
    if (!searchTerm.trim()) return connectionsForDisplay;
    
    const search = searchTerm.toLowerCase();
    return connectionsForDisplay.filter((tool: { name?: string; description?: string; category?: string }) => 
      tool.name?.toLowerCase().includes(search) ||
      tool.description?.toLowerCase().includes(search) ||
      tool.category?.toLowerCase().includes(search)
    );
  }, [connectionsForDisplay, searchTerm]);

  // Update prompt when modal opens with new initialPrompt
  useEffect(() => {
    if (isOpen && initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  const toggleTool = (toolName: string) => {
    setSelectedTools(prev => {
      const isSelected = prev.includes(toolName);
      const newSelection = isSelected 
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName];
      return newSelection;
    });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !prompt.trim()) {
      return;
    }
    
    const agentData = {
      name,
      prompt,
      avatar,
      app_connections: selectedTools,
      agent_tools: [],
      files,
    };

    // Use the caller's handler if there is one
    if (onSubmit) {
      onSubmit({
        name,
        prompt,
        avatar,
        tools: selectedTools,
        files,
        triggers,
      });
    } else {
      // Otherwise create the agent here
      createAgent(agentData, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (selectedFiles: File[]) => {
    const validTypes = ['application/pdf', 'text/plain', 'text/markdown', 'text/csv', 
                       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    const validFiles = selectedFiles.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(file.type) || ['txt', 'md', 'csv', 'xls', 'xlsx', 'pdf', 'doc', 'docx'].includes(extension || '');
    });

    const validSizedFiles = validFiles.filter(file => file.size <= 10 * 1024 * 1024);

    const totalFiles = files.length + validSizedFiles.length;
    const filesToAdd = totalFiles > 10 ? validSizedFiles.slice(0, 10 - files.length) : validSizedFiles;

    setFiles(prev => [...prev, ...filesToAdd]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isStep1Valid = Boolean(name.trim() && prompt.trim());
  const canProceed = currentStep === 1 ? isStep1Valid : true;

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Set up your agent"
      description="Step by step, with full control."
      icon={
        <IconCircle>
          <SlidersHorizontal />
        </IconCircle>
      }
      size="lg"
      dismissible={!isCreating}
      footer={
        <>
          {currentStep > 1 && (
            <Button variant="ghost" size="sm" onClick={handleBack} disabled={isCreating} className="mr-auto">
              <ArrowLeft />
              Back
            </Button>
          )}
          {currentStep < 4 ? (
            <Button size="sm" onClick={handleNext} disabled={!canProceed}>
              {currentStep > 1 ? 'Next' : 'Continue'}
              <ArrowRight />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={!isStep1Valid} loading={isCreating}>
              {isCreating ? 'Creating…' : 'Create agent'}
            </Button>
          )}
        </>
      }
    >
      <WizardSteps steps={STEPS} current={currentStep - 1} className="mb-6" />
      <div key={currentStep} className="animate-sky-in">
        {currentStep === 1 && (
          <BasicInfoStep
            name={name}
            setName={setName}
            prompt={prompt}
            setPrompt={setPrompt}
            avatarPreview={avatarPreview}
            onAvatarChange={handleAvatarChange}
          />
        )}

        {currentStep === 2 && (
          <ToolSelectionStep
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredTools={filteredTools}
            selectedTools={selectedTools}
            toggleTool={toggleTool}
            isLoadingTools={isLoadingTools}
          />
        )}

        {currentStep === 3 && (
          <FileUploadStep
            files={files}
            isDragging={isDragging}
            fileInputRef={fileInputRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            formatFileSize={formatFileSize}
          />
        )}

        {currentStep === 4 && <TriggersStep />}
      </div>
    </Modal>
  );
}

export default ManualAgentModal;
