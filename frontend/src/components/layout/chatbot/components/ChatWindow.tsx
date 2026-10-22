import { useEffect } from 'react';

import ChatHeader from './ChatHeader';
import ChatIframe from './ChatIframe';

interface ChatWindowProps {
  onClose: () => void;
}

// Support chat panel: full screen on phones, a floating night panel bottom-right on desktop
function ChatWindow({ onClose }: ChatWindowProps) {
  // Escape closes it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="Support chat"
      className="fixed inset-0 z-50 flex animate-sky-in flex-col overflow-hidden bg-night-2 text-white md:inset-auto md:right-6 md:bottom-6 md:h-[min(720px,calc(100dvh-48px))] md:w-[min(560px,calc(100vw-48px))] md:rounded-card md:border md:border-white/20 md:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_30px_80px_-20px_rgba(0,0,0,0.8)]"
    >
      <ChatHeader onClose={onClose} />
      <ChatIframe />
    </div>
  );
}

export default ChatWindow;
