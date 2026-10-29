import { useState, useCallback, useEffect, useId, useRef, KeyboardEvent, ReactNode } from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';

import './RotatingCard.css';

interface RotatingCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  flipLabel?: string;
  backLabel?: string;
  label?: string;
  disabled?: boolean;
  onFlip?: (flipped: boolean) => void;
}

export function RotatingCard({
  front,
  back,
  className,
  flipLabel = 'Détails',
  backLabel = 'Retour',
  label = 'Carte',
  disabled = false,
  onFlip,
}: RotatingCardProps) {
  const [flipped, setFlipped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const frontButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const cardId = useId();

  const toggle = useCallback(() => {
    if (disabled) return;
    const next = !flipped;
    setFlipped(next);
    onFlip?.(next);
  }, [disabled, flipped, onFlip]);

  useEffect(() => {
    const button = flipped ? backButtonRef.current : frontButtonRef.current;
    button?.focus();
  }, [flipped]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      if ((e.target as HTMLElement)?.closest('button')) return;
      if (e.key === 'Escape' && flipped) {
        e.preventDefault();
        setFlipped(false);
        onFlip?.(false);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    },
    [disabled, flipped, onFlip, toggle]
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
      aria-label={`${label} — ${flipped ? 'verso' : 'recto'}`}
      aria-expanded={flipped}
      className={`rc ${flipped ? 'is-flipped' : ''} ${className ?? ''}`}
      onKeyDown={handleKey}
      onClick={toggle}
    >
      <div id={cardId} className="rc-inner">
        {/* Front */}
        <div
          className="rc-face rc-face--front"
          data-rc-face="front"
          aria-hidden={flipped}
        >
          {front}
          <button
            ref={frontButtonRef}
            type="button"
            data-rc-flip
            aria-label={flipLabel}
            aria-controls={cardId}
            tabIndex={flipped ? -1 : 0}
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
            ref={backButtonRef}
            type="button"
            data-rc-flip
            aria-label={backLabel}
            aria-controls={cardId}
            tabIndex={flipped ? 0 : -1}
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
