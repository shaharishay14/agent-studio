import { useState } from 'react';
import BuilderInput from './BuilderInput';
import CategoryButtons from './CategoryButtons';
import { useGetTemplates } from '../hooks';

function BuilderSection() {
  const [prompt, setPrompt] = useState('');
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  
  // שימוש ב-hook לשליפת templates
  const { templates, isLoading } = useGetTemplates();

  const handleTemplateSelect = (templatePrompt: string, templateId: string) => {
    setPrompt(templatePrompt);
    setTemplateId(templateId);
  };

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
    // אם המשתמש משנה את ה-prompt באופן ידני (כותב ב-input), נאפס את ה-template_id
    setTemplateId(undefined);
  };

  return (
    <>
      <BuilderInput 
        prompt={prompt} 
        setPrompt={handlePromptChange} 
        templateId={templateId}
      />
      <CategoryButtons 
        onTemplateSelect={handleTemplateSelect} 
        categories={templates}
        isLoading={isLoading}
      />
    </>
  );
}

export default BuilderSection;

