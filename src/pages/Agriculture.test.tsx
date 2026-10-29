import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Agriculture } from './Agriculture';

vi.mock('lucide-react', () => {
  const Icon = () => <span aria-hidden="true" />;
  return {
    Eye: Icon,
    Pencil: Icon,
    Trash2: Icon,
    Plus: Icon,
    Wheat: Icon,
    Tractor: Icon,
    Scale: Icon,
    RotateCw: Icon,
    RotateCcw: Icon,
  };
});

vi.mock('@/lib/DataContext', () => ({
  useData: () => ({
    plots: [],
    campaigns: [],
    cropOperations: [],
    harvests: [],
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/Toast', () => ({
  useToast: () => ({ show: vi.fn() }),
}));

describe('Agriculture', () => {
  it('relie chaque onglet à son panneau et expose le panneau actif', () => {
    render(<Agriculture />);

    const plotsTab = screen.getByRole('tab', { name: /Parcelles/ });
    const plotsPanel = screen.getByRole('tabpanel', { name: /Parcelles/ });

    expect(plotsTab).toHaveAttribute('aria-selected', 'true');
    expect(plotsTab).toHaveAttribute('aria-controls', plotsPanel.id);
    expect(plotsPanel).toHaveAttribute('aria-labelledby', plotsTab.id);

    fireEvent.click(screen.getByRole('tab', { name: /Campagnes/ }));

    expect(screen.getByRole('tab', { name: /Campagnes/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel', { name: /Campagnes/ })).toBeVisible();
    expect(screen.queryByRole('tabpanel', { name: /Parcelles/ })).not.toBeInTheDocument();
  });

  it('permet de naviguer entre les onglets avec les flèches, Home et End', () => {
    render(<Agriculture />);
    const plotsTab = screen.getByRole('tab', { name: /Parcelles/ });

    fireEvent.keyDown(plotsTab, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Campagnes/ })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('tab', { name: /Campagnes/ }), { key: 'End' });
    expect(screen.getByRole('tab', { name: /Récoltes/ })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('tab', { name: /Récoltes/ }), { key: 'Home' });
    expect(screen.getByRole('tab', { name: /Parcelles/ })).toHaveFocus();
  });
});
