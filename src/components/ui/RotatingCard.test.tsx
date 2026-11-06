import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RotatingCard } from './RotatingCard';

vi.mock('lucide-react', () => ({
  RotateCw: () => <span aria-hidden="true">rotate-cw</span>,
}));

function renderCard() {
  return render(
    <RotatingCard
      front={<div>Recto</div>}
      back={<div>Verso</div>}
    />,
  );
}

function face(name: 'front' | 'back') {
  const text = name === 'front' ? 'Recto' : 'Verso';
  const el = screen.getByText(text) as HTMLElement;
  return el.closest(`[data-rc-face="${name}"]`)!;
}

describe('RotatingCard', () => {
  it('retourne la carte au clic et revient au second clic', () => {
    renderCard();

    const card = screen.getByRole('button', { name: 'Ouvrir les détails de Carte' });

    fireEvent.click(card);
    expect(screen.getByText('Verso')).toBeVisible();
    expect(face('front')).toHaveAttribute('aria-hidden', 'true');
    expect(card).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(card);
    expect(screen.getByText('Recto')).toBeVisible();
    expect(face('back')).toHaveAttribute('aria-hidden', 'true');
    expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  it('retourne la carte avec Entrée ou Espace depuis le clavier', () => {
    renderCard();
    const card = screen.getByRole('button', { name: 'Ouvrir les détails de Carte' });

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(screen.getByText('Verso')).toBeVisible();
    expect(card).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(card, { key: ' ' });
    expect(screen.getByText('Recto')).toBeVisible();
    expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  it('revient au recto avec Escape', () => {
    renderCard();
    const card = screen.getByRole('button', { name: 'Ouvrir les détails de Carte' });

    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(card, { key: 'Escape' });
    expect(card).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Recto')).toBeVisible();
  });

  it('affiche flipLabel sur la face avant et backLabel sur la face arrière', () => {
    render(
      <RotatingCard
        front={<div>Recto</div>}
        back={<div>Verso</div>}
        flipLabel="Détails"
        backLabel="Retour"
      />,
    );

    const card = screen.getByRole('button', { name: 'Ouvrir les détails de Carte' });
    const face = (name: 'front' | 'back') =>
      screen.getByText(name === 'front' ? 'Recto' : 'Verso').closest(`[data-rc-face="${name}"]`)!;

    // Face avant : flipLabel sur la face avant (pas cachée), backLabel sur la face arrière (cachée)
    expect(screen.getByText('Détails')).toBeInTheDocument();
    expect(face('front')).toHaveAttribute('aria-hidden', 'false');
    expect(face('back')).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(card);

    // Face arrière affichée : backLabel désormais sur la face visible
    expect(face('front')).toHaveAttribute('aria-hidden', 'true');
    expect(face('back')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText('Retour')).toBeInTheDocument();
  });

  it('ne bascule pas quand on clique sur un élément interactif interne', () => {
    const { container } = render(
      <RotatingCard
        front={
          <div>
            <div>Recto</div>
            <button type="button">Modifier</button>
          </div>
        }
        back={<div>Verso</div>}
      />,
    );

    const card = container.querySelector('[role="button"]')!;
    const modifier = screen.getByRole('button', { name: 'Modifier' });

    fireEvent.click(modifier);
    expect(screen.getByText('Recto')).toBeVisible();
    expect(face('front')).toHaveAttribute('aria-hidden', 'false');

    // Le clic sur la carte elle-même bascule toujours
    fireEvent.click(card);
    expect(screen.getByText('Verso')).toBeVisible();
  });
});
