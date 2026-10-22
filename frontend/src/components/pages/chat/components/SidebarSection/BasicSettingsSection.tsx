import { useRef } from 'react';
import { Bot, ImagePlus, X } from 'lucide-react';

import { Button, IconButton } from '@/components/ui/button';
import { PillInput } from '@/components/ui/pill-input';
import { TextArea } from '@/components/ui/text-area';
import { formatAvatarUrl } from '../../utils';

interface BasicSettingsSectionProps {
  agentName: string;
  setAgentName: (name: string) => void;
  agentPrompt: string;
  setAgentPrompt: (prompt: string) => void;
  onSaveSettings: () => void;
  isSaving: boolean;
  selectedAvatar?: File | null;
  previewUrl?: string | null;
  onAvatarSelect?: (file: File | null) => void;
  agentAvatar?: string | null;
}

export const BasicSettingsSection = ({
  agentName,
  setAgentName,
  agentPrompt,
  setAgentPrompt,
  onSaveSettings,
  isSaving,
  selectedAvatar,
  previewUrl,
  onAvatarSelect,
  agentAvatar
}: BasicSettingsSectionProps) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const formattedAvatar = formatAvatarUrl(agentAvatar || null);
  const imageUrl = previewUrl || formattedAvatar;

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-white/85">Picture</span>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/svg+xml,image/jpeg,image/jpg,image/png"
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            onAvatarSelect?.(file);
          }}
        />
        <div className="flex items-center gap-3.5">
          <span
            className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-pill border border-white/25 bg-white/8 bg-cover bg-center text-white/70"
            style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
            aria-hidden="true"
          >
            {!imageUrl && <Bot className="size-6" strokeWidth={1.7} />}
          </span>
          {selectedAvatar ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-white/72">Save to apply the new picture</span>
              <IconButton size="sm" aria-label="Cancel new picture" onClick={() => onAvatarSelect?.(null)}>
                <X />
              </IconButton>
            </div>
          ) : (
            <Button variant="glass" size="sm" onClick={() => avatarInputRef.current?.click()}>
              <ImagePlus />
              Choose image
            </Button>
          )}
        </div>
        <p className="m-0 text-xs text-white/55">SVG, JPEG or PNG, up to 5 MB</p>
      </div>

      <PillInput label="Name" value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Agent name" />

      <TextArea
        label="Instructions"
        value={agentPrompt}
        onChange={(e) => setAgentPrompt(e.target.value)}
        placeholder="What should this agent do?"
        rows={7}
      />

      <Button block onClick={onSaveSettings} loading={isSaving}>
        {isSaving ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  );
};
