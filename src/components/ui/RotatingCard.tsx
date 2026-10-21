import { useState, useCallback, useRef, KeyboardEvent, ReactNode } from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';

import './RotatingCard.css';

interface RotatingCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  flipLabel?: string;
  backLabel?: string;
  disabled?: boolean;
  onFlip?: (flipped: boolean) => void;
}

export function RotatingCard({
  front,
  back,
  className,
  flipLabel = 'Détails',
  backLabel = 'Retour',
  disabled = false,
  onFlip,
}: RotatingCardProps) {
  const [flipped, setFlipped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    if (disabled) return;
    const next = !flipped;
    setFlipped(next);
    onFlip?.(next);
  }, [disabled, flipped, onFlip]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'Escape' && flipped) {
        e.preventDefault();
        setFlipped(false);
        containerRef.current?.focus();
      }
      if ((e.key === 'Enter' || e.key === ' ') && !flipped) {
        const target = e.target as HTMLElement;
        if (target?.closest('[data-rc-flip]')) {
          toggle();
        }
      }
    },
    [disabled, flipped, toggle]
  );

  const handleFlipBtnClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.stopPropagation();
      toggle();
    },
    [disabled, toggle]
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={flipped ? 'Verso de la carte' : 'Recto de la carte'}
      aria-expanded={flipped}
      className={`rc ${flipped ? 'is-flipped' : ''} ${className ?? ''}`}
      onKeyDown={handleKey}
      onClick={toggle}
    >
      <div className="rc-inner">
        {/* Front */}
        <div
          className="rc-face rc-face--front"
          data-rc-face="front"
          aria-hidden={flipped}
        >
          {front}
          <button
            type="button"
            data-rc-flip
            aria-label={flipLabel}
            aria-controls="rc-card"
            onClick={handleFlipBtnClick}
            className="rc-flip-btn rc-flip-btn--front"
          >
            <RotateCw size={12} /> <span>{flipLabel}</span>
          </button>
        </div>
        {/* Back */}
        <div
          className="rc-face rc-face--back"
          data-rc-face="back"
          aria-hidden={!flipped}
        >
          {back}
          <button
            type="button"
            data-rc-flip
            aria-label={backLabel}
            aria-controls="rc-card"
            onClick={handleFlipBtnClick}
            className="rc-flip-btn rc-flip-btn--back"
          >
            <RotateCcw size={12} /> <span>{backLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
