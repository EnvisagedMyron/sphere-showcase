import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  description: string;
  shapePosition: { x: number; y: number };
}

const InfoModal = ({ isOpen, onClose, name, description, shapePosition }: InfoModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate position with bounds checking - offset more to not block shape
  const modalWidth = 320;
  const modalHeight = 200;
  const padding = 20;
  const offsetX = 80; // Increased offset from shape
  
  let left = shapePosition.x + offsetX;
  let top = shapePosition.y - modalHeight / 2;
  
  // Determine if modal should go left or right of shape
  let modalOnRight = true;
  if (left + modalWidth > window.innerWidth - padding) {
    left = shapePosition.x - modalWidth - offsetX;
    modalOnRight = false;
  }
  if (top < padding) {
    top = padding;
  }
  if (top + modalHeight > window.innerHeight - padding) {
    top = window.innerHeight - modalHeight - padding;
  }

  // Calculate line connection point (center of modal edge closest to shape)
  const modalCenterY = top + modalHeight / 2;
  const lineEndX = modalOnRight ? left : left + modalWidth;
  const lineEndY = modalCenterY;

  return (
    <>
      {/* SVG Line connecting shape to modal */}
      <svg 
        className="fixed inset-0 z-40 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        <line
          x1={shapePosition.x}
          y1={shapePosition.y}
          x2={lineEndX}
          y2={lineEndY}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.7"
        />
        <circle
          cx={shapePosition.x}
          cy={shapePosition.y}
          r="4"
          fill="hsl(var(--primary))"
        />
      </svg>

      <div 
        ref={modalRef}
        className="glass-panel rounded-xl p-6 w-80 animate-scale-in fixed z-50"
        style={{ left: `${left}px`, top: `${top}px` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gradient">{name}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        
        <p className="text-foreground/80 text-base leading-relaxed">
          {description}
        </p>
        
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Press ESC or click X to close
          </p>
        </div>
      </div>
    </>
  );
};

export default InfoModal;
