import { useState, useCallback, KeyboardEvent, ReactNode } from 'react';
import { RotateCw } from 'lucide-react';

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
  flipLabel,
  backLabel,
  label = 'Carte',
  disabled = false,
  onFlip,
}: RotatingCardProps) {
  const [flipped, setFlipped] = useState(false);

  const flip = useCallback(() => {
    if (disabled) return;
    const next = !flipped;
    setFlipped(next);
    onFlip?.(next);
  }, [disabled, flipped, onFlip]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      // Ne pas basculer si on clique sur un élément interactif (bouton Modifier/Supprimer…)
      if ((e.target as HTMLElement)?.closest('a, button, input, select, textarea')) return;
      // Ne pas basculer pendant une sélection de texte
      if (window.getSelection()?.toString()) return;
      flip();
    },
    [disabled, flip],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip();
      }
      if (e.key === 'Escape') {
        setFlipped(false);
        onFlip?.(false);
      }
    },
    [disabled, flip, onFlip],
  );

  return (
    <div
      className={`rc-container ${flipped ? 'is-flipped' : ''} cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 ${className ?? ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={flipped}
      aria-label={`${flipped ? 'Fermer' : 'Ouvrir'} les détails de ${label}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <div className="rc-inner">
        {/* Face avant */}
        <div className="rc-face rc-face--front" data-rc-face="front" aria-hidden={flipped}>
          <div
            className="absolute top-3 right-3 text-muted/40 group-hover:text-accent-primary transition-colors"
            aria-hidden="true"
          >
            <RotateCw size={14} />
          </div>
          <div className="rc-content">{front}</div>
        </div>
        {/* Face arrière */}
        <div className="rc-face rc-face--back" data-rc-face="back" aria-hidden={!flipped}>
          <div className="rc-content">{back}</div>
        </div>
      </div>
    </div>
  );
}
