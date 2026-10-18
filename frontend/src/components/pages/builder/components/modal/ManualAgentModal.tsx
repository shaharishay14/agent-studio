import { useState, useMemo, useEffect, useRef } from 'react';
import useDarkModeStore from '../../../../../../store/darkmode.store';
import { Settings as SettingsIcon, Wrench, Upload, Zap } from 'lucide-react';
import {
  ModalHeader,
  StepIndicator,
  BasicInfoStep,
  ToolSelectionStep,
  FileUploadStep,
  TriggersStep,
  ModalFooter
} from './components';
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
  triggers?: any[];
}

type Step = 1 | 2 | 3 | 4;

function ManualAgentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialPrompt = ''
}: ManualAgentModalProps) {
  const { isDarkMode } = useDarkModeStore();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const { createAgent, isCreating } = useCreateAgent();
  
  // Form data
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [triggers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { connectionsForDisplay, isLoading: isLoadingTools } = useGetConnectionsForDisplay();

  // Filter tools based on search
  const filteredTools = useMemo(() => {
    if (!connectionsForDisplay || connectionsForDisplay.length === 0) return [];
    
    if (!searchTerm.trim()) return connectionsForDisplay;
    
    const search = searchTerm.toLowerCase();
    return connectionsForDisplay.filter((tool: any) => 
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

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Basic Info', subtitle: 'Name, avatar, and prompt', icon: SettingsIcon },
    { number: 2, title: 'Tool Selection', subtitle: "Choose your agent's capabilities", icon: Wrench },
    { number: 3, title: 'File Upload', subtitle: 'Add knowledge base files (optional)', icon: Upload },
    { number: 4, title: 'Triggers', subtitle: 'Set up automated triggers (optional)', icon: Zap },
  ];

  const toggleTool = (toolName: string) => {
    setSelectedTools(prev => {
      const isSelected = prev.includes(toolName);
      const newSelection = isSelected 
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName];
      return newSelection;
    });
  };

  // Map icon from integrations format
  const getToolIcon = (toolName: string, category: string) => {
    const iconMap: Record<string, string> = {
      'Gmail': '✉️',
      'Google Drive': '💾',
      'Google Docs': '📄',
      'Google Sheets': '📊',
      'Google Calendar': '📅',
      'Slack': '#️⃣',
      'Twitter': '🐦',
      'X': '🐦',
      'LinkedIn': '💼',
      'Notion': '📝',
      'GitHub': '🐙',
      'Linear': '📋',
      'Reddit': '🔴',
      'Discord': '💬',
      'Telegram': '✈️',
      'WhatsApp': '📱',
      'Zoom': '📹',
      'Trello': '📌',
      'Asana': '✓',
      'Jira': '🎯',
      'Dropbox': '📦',
      'OneDrive': '☁️',
      'Figma': '🎨',
      'Stripe': '💳',
      'PayPal': '💰',
      'Shopify': '🛒',
      'Mailchimp': '📧',
      'HubSpot': '🚀',
      'Salesforce': '☁️',
    };
    
    const categoryIconMap: Record<string, string> = {
      'communication': '💬',
      'productivity': '⚡',
      'messaging': '💬',
      'social': '🌐',
      'email': '✉️',
      'storage': '💾',
      'developer': '⚙️',
      'finance': '💰',
      'marketing': '📣',
      'design': '🎨',
      'video': '📹',
      'analytics': '📊',
    };
    
    return iconMap[toolName] || categoryIconMap[category.toLowerCase()] || '🔧';
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

    // אם יש callback מותאם אישית, נשתמש בו
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
      // אחרת נשתמש ב-hook המובנה
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

  const handleAddTrigger = () => {
    // TODO: Open trigger modal
    console.log('Add trigger clicked');
  };

  const isStep1Valid = Boolean(name.trim() && prompt.trim());
  const canProceed = currentStep === 1 ? isStep1Valid : true;

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto pt-4 sm:pt-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-3xl rounded-xl sm:rounded-2xl shadow-2xl border sm:border-2 mt-0 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col ${
          isDarkMode
            ? 'bg-gray-900 border-purple-500/30'
            : 'bg-white border-purple-200'
        }`}
        style={{
          boxShadow: isDarkMode 
            ? '0 0 60px rgba(168, 85, 247, 0.4)' 
            : '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Header */}
        <div className={`px-4 sm:px-8 py-4 sm:py-6 border-b flex-shrink-0 ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <ModalHeader onClose={onClose} />
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Content */}
        <div className={`px-4 sm:px-8 py-4 sm:py-8 overflow-y-auto flex-1 min-h-0 ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}>
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
              getToolIcon={getToolIcon}
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

          {currentStep === 4 && (
            <TriggersStep onAddTrigger={handleAddTrigger} />
          )}
        </div>

        {/* Footer */}
        <ModalFooter
          currentStep={currentStep}
          canProceed={canProceed}
          isCreating={isCreating}
          isStep1Valid={isStep1Valid}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

export default ManualAgentModal;
