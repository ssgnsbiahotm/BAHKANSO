import { useState, useCallback, KeyboardEvent, ReactNode } from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';

interface RotatingCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  flipLabel?: string;
  backLabel?: string;
}

export function RotatingCard({ front, back, className = '', flipLabel = 'Détails', backLabel = 'Retour' }: RotatingCardProps) {
  const [flipped, setFlipped] = useState(false);

  const toggle = useCallback(() => setFlipped(f => !f), []);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
    if (e.key === 'Escape' && flipped) {
      e.preventDefault();
      setFlipped(false);
    }
  };

  return (
    <div
      className={`rotating-card-wrapper [perspective:1200px] ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKey}
      aria-label={flipped ? backLabel : flipLabel}
    >
      <div
        className={`rotating-card-inner relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* Front */}
        <div className={`rotating-card-face [backface-visibility:hidden] ${flipped ? 'pointer-events-none' : ''}`}>
          {front}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggle(); }}
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50/90 hover:bg-green-100 rounded-lg transition-colors"
            aria-label={flipLabel}
          >
            <RotateCw size={12} /> {flipLabel}
          </button>
        </div>
        {/* Back */}
        <div className={`rotating-card-face [backface-visibility:hidden] [transform:rotateY(180deg)] absolute inset-0 ${flipped ? '' : 'pointer-events-none'}`}>
          {back}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggle(); }}
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
