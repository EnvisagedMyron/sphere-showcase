import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  description: string;
  position: { x: number; y: number };
}

const InfoModal = ({ isOpen, onClose, name, description, position }: InfoModalProps) => {
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

  // Calculate position with bounds checking
  const modalWidth = 320;
  const modalHeight = 200;
  const padding = 20;
  
  let left = position.x + 20;
  let top = position.y - modalHeight / 2;
  
  // Keep modal within viewport bounds
  if (left + modalWidth > window.innerWidth - padding) {
    left = position.x - modalWidth - 20;
  }
  if (top < padding) {
    top = padding;
  }
  if (top + modalHeight > window.innerHeight - padding) {
    top = window.innerHeight - modalHeight - padding;
  }

  return (
    <div 
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="glass-panel rounded-xl p-6 w-80 animate-scale-in absolute"
        style={{ left: `${left}px`, top: `${top}px` }}
        onClick={(e) => e.stopPropagation()}
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
            Click outside or press ESC to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
