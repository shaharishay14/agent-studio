import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutTemplate } from 'lucide-react';

import { PromptBox, type PromptMode } from '@/components/ui/prompt-box';
import { Chip } from '@/components/ui/chip';
import { BlurFade } from '@/components/ui/blur-fade';
import { useUserStore } from '../../../../../../store/user.store';
import { useCreateAgent, useGetTemplates } from '../../hooks';
import { ManualAgentModal } from '../modal';
import type { ManualAgentData } from '../modal';
import type { ServerTemplateCategory } from '../../types';

const SUGGESTIONS = [
  'Summarize my inbox every morning',
  'Plan my week from my calendar',
  'Answer customers on WhatsApp',
];

// The hero prompt box and chips. Same create flow as before: logged-out users go to sign in,
// YOLO creates right away (with the template id when a template was picked), Manual opens the wizard.
function HeroPrompt({ startDelay = 0 }: { startDelay?: number }) {
  const [prompt, setPrompt] = useState('');
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<PromptMode>('yolo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'suggestions' | 'categories' | ServerTemplateCategory>('suggestions');

  const { isAuthenticated } = useUserStore();
  const navigate = useNavigate();
  const { handleCreate, createAgent, isCreating } = useCreateAgent();
  const { templates } = useGetTemplates();

  const handlePromptChange = (next: string) => {
    setPrompt(next);
    // typing by hand drops the template
    setTemplateId(undefined);
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;

    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }

    if (mode === 'manual') {
      setIsModalOpen(true);
    } else {
      handleCreate({
        prompt,
        ...(templateId && { template_id: templateId }),
      });
    }
  };

  const handleManualSubmit = (data: ManualAgentData) => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      setIsModalOpen(false);
      return;
    }

    createAgent({
      prompt: data.prompt,
    });
    setIsModalOpen(false);
    setPrompt('');
  };

  return (
    <>
      <BlurFade delay={startDelay} className="w-full max-w-[700px]">
        <PromptBox
          value={prompt}
          onChange={handlePromptChange}
          mode={mode}
          onModeChange={setMode}
          onSubmit={handleSubmit}
          submitting={isCreating}
          autoFocus={isAuthenticated}
        />
      </BlurFade>

      <BlurFade delay={startDelay} className="flex w-full max-w-[960px] flex-wrap justify-center gap-2.5">
        {view === 'suggestions' && (
          <>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} onClick={() => handlePromptChange(s)}>
                {s}
              </Chip>
            ))}
            {templates.length > 0 && (
              <Chip onClick={() => setView('categories')}>
                <LayoutTemplate />
                Templates
              </Chip>
            )}
          </>
        )}

        {view === 'categories' && (
          <>
            <Chip onClick={() => setView('suggestions')} aria-label="Back to suggestions">
              <ArrowLeft />
              Back
            </Chip>
            {templates.map((category) => (
              <Chip key={category.category_display_name} onClick={() => setView(category)}>
                {category.category_display_name}
              </Chip>
            ))}
          </>
        )}

        {typeof view === 'object' && (
          <>
            <Chip onClick={() => setView('categories')} aria-label="Back to categories">
              <ArrowLeft />
              {view.category_display_name}
            </Chip>
            {view.templates.map((template) => (
              <Chip
                key={template.id}
                title={template.description}
                onClick={() => {
                  setPrompt(template.system_prompt);
                  setTemplateId(template.id);
                  setView('suggestions');
                }}
              >
                {template.name}
              </Chip>
            ))}
          </>
        )}
      </BlurFade>

      <ManualAgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleManualSubmit}
        initialPrompt={prompt}
      />
    </>
  );
}

export default HeroPrompt;
