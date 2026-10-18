import { useState, useEffect } from 'react';
import { TouchSensor, MouseSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';

export const useDraggableButton = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [buttonPosition, setButtonPosition] = useState({ x: 16, y: 64 });
  const [hasUserDragged, setHasUserDragged] = useState(() => {
    // Check if user has already dragged the button before
    return localStorage.getItem('hasUserDraggedButton') === 'true';
  });

  // Setup sensors for drag and drop with activation constraint
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8, // 8px of movement required before drag starts
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150, // 150ms delay before drag starts
      tolerance: 8, // 8px tolerance
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Handle drag end - save final position
  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    if (delta) {
      // Mark that user has dragged the button
      if (!hasUserDragged) {
        setHasUserDragged(true);
        localStorage.setItem('hasUserDraggedButton', 'true');
      }
      
      setButtonPosition((prev) => {
        const newX = prev.x + delta.x;
        const newY = prev.y + delta.y;
        
        // Constrain to viewport
        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 80;
        
        return {
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        };
      });
    }
  };

  // Detect mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    buttonPosition,
    hasUserDragged,
    sensors,
    handleDragEnd,
  };
};

