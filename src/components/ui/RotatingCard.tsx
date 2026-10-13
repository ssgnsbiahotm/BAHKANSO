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

  const toggle = useCallback(() => setFlipped((value) => !value), []);

  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
    if (event.key === 'Escape' && flipped) {
      event.preventDefault();
      setFlipped(false);
    }
  };

  return (
    <div
      className={`group [perspective:1200px] ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKey}
      aria-label={flipped ? backLabel : flipLabel}
    >
      <div
        className={`relative h-64 w-full rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        <div className={`absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden] ${flipped ? 'pointer-events-none' : ''}`}>
          {front}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggle();
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-[11px] font-semibold text-green-700 transition hover:bg-green-100"
            aria-label={flipLabel}
          >
            <RotateCw size={12} /> {flipLabel}
          </button>
        </div>

        <div className={`absolute inset-0 overflow-hidden rounded-2xl bg-slate-900 text-white [backface-visibility:hidden] [transform:rotateY(180deg)] ${flipped ? '' : 'pointer-events-none'}`}>
          {back}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggle();
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/15"
            aria-label={backLabel}
          >
            <RotateCcw size={12} /> {backLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
