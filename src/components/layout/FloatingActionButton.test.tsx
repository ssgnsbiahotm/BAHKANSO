import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FloatingActionButton } from './FloatingActionButton';

vi.mock('lucide-react', () => ({
  Plus: () => <span aria-hidden="true">plus</span>,
  X: () => <span aria-hidden="true">x</span>,
  Receipt: () => <span aria-hidden="true">receipt</span>,
  FileText: () => <span aria-hidden="true">file</span>,
  Sprout: () => <span aria-hidden="true">sprout</span>,
  Package: () => <span aria-hidden="true">package</span>,
  Beef: () => <span aria-hidden="true">beef</span>,
  HardHat: () => <span aria-hidden="true">hardhat</span>,
}));

describe('FloatingActionButton', () => {
  it('nomme le bouton principal et expose son état ouvert/fermé', () => {
    render(<FloatingActionButton onAction={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Ouvrir les actions rapides' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');

    fireEvent.click(button);

    expect(screen.getByRole('button', { name: 'Fermer les actions rapides' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
