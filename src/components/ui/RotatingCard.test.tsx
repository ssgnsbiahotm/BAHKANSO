import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RotatingCard } from './RotatingCard';

vi.mock('lucide-react', () => ({
  RotateCw: () => <span aria-hidden="true">rotate-cw</span>,
  RotateCcw: () => <span aria-hidden="true">rotate-ccw</span>,
}));

function renderCard() {
  return render(
    <RotatingCard
      front={<div>Recto</div>}
      back={<div>Verso</div>}
    />,
  );
}

describe('RotatingCard', () => {
  it('retourne la carte avec le bouton Détails puis revient avec Retour', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Détails' }));
    expect(screen.getByText('Verso')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retour' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
    expect(screen.getByText('Recto')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Détails' })).toHaveFocus();
  });

  it('retourne la carte avec Entrée ou Espace depuis le conteneur', () => {
    renderCard();
    const card = screen.getByRole('region', { name: 'Carte — recto' });

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(card).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(card, { key: ' ' });
    expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  it('revient au recto avec Escape et rend le focus au bouton Détails', () => {
    renderCard();
    const card = screen.getByRole('region', { name: 'Carte — recto' });

    fireEvent.click(screen.getByRole('button', { name: 'Détails' }));
    fireEvent.keyDown(card, { key: 'Escape' });

    expect(card).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Détails' })).toHaveFocus();
  });

  it('référence une cible réelle avec aria-controls', () => {
    renderCard();
    const button = screen.getByRole('button', { name: 'Détails' });
    const targetId = button.getAttribute('aria-controls');

    expect(targetId).toBeTruthy();
    expect(document.getElementById(targetId as string)).toBeInTheDocument();
  });
});
