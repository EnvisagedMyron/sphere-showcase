import { X } from 'lucide-react';
import { useEffect } from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  description: string;
}

const InfoModal = ({ isOpen, onClose, name, description }: InfoModalProps) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div 
        className="glass-panel rounded-xl p-8 max-w-md w-full mx-4 animate-scale-in pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gradient">{name}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-foreground/80 text-lg leading-relaxed">
          {description}
        </p>
        
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Click anywhere outside or press ESC to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
