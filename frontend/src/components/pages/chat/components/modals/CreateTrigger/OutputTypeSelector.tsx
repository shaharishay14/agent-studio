import { Mail, TriangleAlert } from 'lucide-react';

import { BrandIcon } from '@/components/ui/brand-icon';
import { Button } from '@/components/ui/button';
import { ChoiceCard } from '@/components/ui/choice-card';
import { PillInput } from '@/components/ui/pill-input';
import StepHeading from './StepHeading';

type OutputType = 'email' | 'whatsapp' | null;

interface OutputTypeSelectorProps {
  outputType: OutputType;
  email: string;
  whatsappPhone: string;
  onOutputTypeChange: (type: OutputType) => void;
  onEmailChange: (email: string) => void;
  onWhatsappPhoneChange: (phone: string) => void;
}

function OutputTypeSelector({ outputType, email, whatsappPhone, onOutputTypeChange, onEmailChange, onWhatsappPhoneChange }: OutputTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <StepHeading title="Where should results go?" subtitle="The agent's answer is sent here after each run." />
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard icon={<Mail />} title="Email" description="Send the answer to an inbox" selected={outputType === 'email'} onClick={() => onOutputTypeChange('email')} />
          <ChoiceCard
            icon={<BrandIcon name="whatsapp" size={18} />}
            title="WhatsApp"
            description="Send the answer to your phone"
            selected={outputType === 'whatsapp'}
            onClick={() => onOutputTypeChange('whatsapp')}
          />
        </div>
      </div>

      {outputType === 'email' && (
        <PillInput
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail />}
        />
      )}

      {outputType === 'whatsapp' && (
        <div className="flex animate-sky-in flex-col gap-4">
          <p className="m-0 flex items-start gap-2.5 rounded-2xl border border-busy/35 bg-busy/10 px-4 py-3 text-sm text-busy">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
            Verify your WhatsApp number first to receive results there.
          </p>
          <PillInput
            label="WhatsApp number"
            type="tel"
            value={whatsappPhone}
            onChange={(e) => onWhatsappPhoneChange(e.target.value)}
            placeholder="+1 234 567 890"
            autoComplete="tel"
            helper="International format, starting with +"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="glass" size="sm">
              Get verification link
            </Button>
            <Button variant="glass" size="sm">
              Check verification
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OutputTypeSelector;
