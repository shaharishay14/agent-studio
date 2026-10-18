import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { SidebarToggleButton } from '../SidebarToggleButton';
import { DragHint } from './DragHint';

interface DraggableButtonProps {
  isDarkMode: boolean;
  onToggle: () => void;
  isMobile: boolean;
  position: { x: number; y: number };
  showHint: boolean;
}

export const DraggableButton = ({ isDarkMode, onToggle, isMobile, position, showHint }: DraggableButtonProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'sidebar-toggle-button',
    disabled: !isMobile,
  });

  const style: React.CSSProperties = {
    transform: isMobile && transform ? CSS.Translate.toString(transform) : undefined,
    cursor: isMobile ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
    left: isMobile ? `${position.x}px` : undefined,
    top: isMobile ? `${position.y}px` : undefined,
  };

  const handleClick = () => {
    if (!isDragging) {
      onToggle();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isMobile ? listeners : {})}
      {...(isMobile ? attributes : {})}
      className={`fixed z-[9999] md:absolute md:top-full md:left-0 ${
        !isDragging && isMobile ? 'transition-all duration-300' : ''
      }`}
      title={isMobile ? "Drag to move | Click to open settings" : "Open settings"}
      onClick={handleClick}
    >
      {/* Show drag hint only on mobile and if user hasn't dragged yet */}
      {showHint && isMobile && (
        <div className="animate-in fade-in duration-1000 delay-500">
          <DragHint isDarkMode={isDarkMode} />
        </div>
      )}
      
      <div
        className={`transition-all duration-200 relative ${
          isDragging ? 'scale-110 opacity-80 drop-shadow-2xl' : 'animate-in fade-in zoom-in duration-500'
        }`}
      >
        <SidebarToggleButton isDarkMode={isDarkMode} onToggle={onToggle} />
      </div>
    </div>
  );
};

