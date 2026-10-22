import { Bot, ImagePlus } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { PillInput } from '@/components/ui/pill-input';
import { TextArea } from '@/components/ui/text-area';
import { cn } from '@/lib/utils';

interface BasicInfoStepProps {
  name: string;
  setName: (name: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  avatarPreview: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function BasicInfoStep({ name, setName, prompt, setPrompt, avatarPreview, onAvatarChange }: BasicInfoStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <PillInput label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project planner" required autoFocus />

      <TextArea
        label="Instructions"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Help me plan projects: break big tasks into steps, suggest an order and realistic deadlines, and flag anything that blocks something else."
        rows={6}
        required
      />

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-white/85">Picture (optional)</span>
        <div className="flex items-center gap-4">
          <span
            className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-pill border border-white/30 bg-white/8 text-white/70"
            aria-hidden="true"
          >
            {avatarPreview ? <img src={avatarPreview} alt="" className="size-full object-cover" /> : <Bot className="size-6" strokeWidth={1.7} />}
          </span>
          <label className={cn(buttonVariants({ variant: 'glass', size: 'sm' }), 'cursor-pointer focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-white')}>
            <ImagePlus />
            {avatarPreview ? 'Change picture' : 'Choose picture'}
            <input type="file" accept="image/*" onChange={onAvatarChange} className="sr-only" />
          </label>
        </div>
        <p className="m-0 text-[13px] text-white/60">Skip it and we'll make one for you.</p>
      </div>
    </div>
  );
}

export default BasicInfoStep;
