import { MessageCircle } from 'lucide-react';

interface FloatingButtonProps {
  onClick: () => void;
}

// Round glass support button; hover fills white with a dark icon and lifts 3px.
function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <div className="fixed right-4 bottom-4 z-50 md:right-6 md:bottom-6">
      <button
        onClick={onClick}
        aria-label="Open support chat"
        className="sky-glass grid size-14 place-items-center rounded-pill text-white transition-[background-color,color,transform] duration-200 hover:-translate-y-[3px] hover:bg-white hover:text-on-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
      >
        <MessageCircle className="size-5" strokeWidth={1.7} />
      </button>
    </div>
  );
}

export default FloatingButton;
