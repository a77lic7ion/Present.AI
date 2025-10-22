
import { useState, useCallback, useRef, RefObject } from 'react';

type Layout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DragResizeAction = 'drag' | 'resize';
type ResizeDirection = 'tl' | 't' | 'tr' | 'l' | 'r' | 'bl' | 'b' | 'br';

export const useDragAndResize = (
  initialLayout: Layout,
  onLayoutChange: (layout: Layout) => void,
  containerRef: RefObject<HTMLDivElement>
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeDirection | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, action: DragResizeAction, direction?: ResizeDirection) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const startLayout = { ...initialLayout };

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const dxPercent = (dx / containerRect.width) * 100;
        const dyPercent = (dy / containerRect.height) * 100;

        let newLayout = { ...startLayout };

        if (action === 'drag') {
          newLayout.x = startLayout.x + dxPercent;
          newLayout.y = startLayout.y + dyPercent;
        } else if (action === 'resize' && direction) {
          if (direction.includes('r')) newLayout.width = Math.max(10, startLayout.width + dxPercent);
          if (direction.includes('l')) {
            newLayout.width = Math.max(10, startLayout.width - dxPercent);
            newLayout.x = startLayout.x + dxPercent;
          }
          if (direction.includes('b')) newLayout.height = Math.max(10, startLayout.height + dyPercent);
          if (direction.includes('t')) {
            newLayout.height = Math.max(10, startLayout.height - dyPercent);
            newLayout.y = startLayout.y + dyPercent;
          }
        }

        // Clamp values to stay within container bounds
        newLayout.x = Math.max(0, Math.min(newLayout.x, 100 - newLayout.width));
        newLayout.y = Math.max(0, Math.min(newLayout.y, 100 - newLayout.height));
        newLayout.width = Math.min(newLayout.width, 100 - newLayout.x);
        newLayout.height = Math.min(newLayout.height, 100 - newLayout.y);

        onLayoutChange(newLayout);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      if (action === 'drag') {
        setIsDragging(true);
      } else if (direction) {
        setIsResizing(direction);
      }

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp, { once: true });
    },
    [initialLayout, onLayoutChange, containerRef]
  );

  return {
    isDragging,
    isResizing,
    handleMouseDown,
  };
};
