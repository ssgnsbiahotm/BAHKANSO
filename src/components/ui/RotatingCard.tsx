import { useState, KeyboardEvent, ReactNode } from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';

import './RotatingCard.css';

interface RotatingCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  flipLabel?: string;
  backLabel?: string;
}

export function RotatingCard({
  front,
  back,
  className,
  flipLabel = 'Détails',
  backLabel = 'Retour',
}: RotatingCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && flipped) {
      e.preventDefault();
      setFlipped(false);
    }
  };

  const toggle = () => setFlipped((f) => !f);

  return (
    <div className={`rc ${flipped ? 'is-flipped' : ''} ${className ?? ''}`} onKeyDown={handleKey}>
      <div className="rc-inner">
        {/* Front */}
        <div className="rc-face rc-face--front">
          {front}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50/90 hover:bg-green-100 rounded-lg transition-colors"
            aria-label={flipLabel}
          >
            <RotateCw size={12} /> {flipLabel}
          </button>
        </div>
        {/* Back */}
        <div className="rc-face rc-face--back">
          {back}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white/90 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            aria-label={backLabel}
          >
            <RotateCcw size={12} /> {backLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
