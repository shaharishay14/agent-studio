import { LifeBuoy, X } from 'lucide-react';

import { IconButton } from '@/components/ui/button';
import { IconCircle } from '@/components/ui/icon-circle';

interface ChatHeaderProps {
  onClose: () => void;
}

function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-white/12 px-5 py-4">
      <IconCircle>
        <LifeBuoy />
      </IconCircle>
      <div className="min-w-0 flex-1">
        <h2 className="m-0 font-display text-lg leading-6 font-medium tracking-[-0.02em]">Support</h2>
        <p className="m-0 text-[13px] text-white/66">Ask anything about Agent Studio</p>
      </div>
      <IconButton aria-label="Close support chat" onClick={onClose}>
        <X />
      </IconButton>
    </div>
  );
}

export default ChatHeader;
