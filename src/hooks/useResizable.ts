import { useState, useCallback, useRef, useEffect } from 'react';

interface ResizableState {
  width: number;
  height: number;
  x: number;
  y: number;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const useResizable = (initialWidth: number, initialHeight: number) => {
  const [size, setSize] = useState<ResizableState>({
    width: initialWidth,
    height: initialHeight,
    x: 0,
    y: 0,
  });

  const resizing = useRef<ResizeDirection | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0, x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;

      e.preventDefault();

      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      const direction = resizing.current;
      const newSize = { ...startSize.current };

      if (direction.includes('e')) {
        newSize.width = Math.max(600, startSize.current.width + deltaX);
      }
      if (direction.includes('w')) {
        const newWidth = Math.max(600, startSize.current.width - deltaX);
        if (newWidth >= 600) {
          newSize.width = newWidth;
          newSize.x = startSize.current.x + deltaX;
        }
      }
      if (direction.includes('s')) {
        newSize.height = Math.max(400, startSize.current.height + deltaY);
      }
      if (direction.includes('n')) {
        const newHeight = Math.max(400, startSize.current.height - deltaY);
        if (newHeight >= 400) {
          newSize.height = newHeight;
          newSize.y = startSize.current.y + deltaY;
        }
      }

      setSize(newSize);
    };

    const handleMouseUp = () => {
      resizing.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = useCallback((direction: ResizeDirection) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    resizing.current = direction;
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };
  }, [size]);

  return {
    size,
    handleMouseDown,
  };
};
