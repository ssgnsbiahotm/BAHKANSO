import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiCard } from './KpiCard';
import type { KpiCardProps } from './KpiCard';

const icon = <span aria-label="icone" />;

function renderCard(props: Partial<KpiCardProps> = {}) {
  return render(<KpiCard label="Test" value="42" icon={icon} {...props} />);
}

function iconWrapper() {
  return screen.getByLabelText('icone').closest('div') as HTMLElement;
}

describe('KpiCard', () => {
  it('rend label, valeur et icône', () => {
    renderCard();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByLabelText('icone')).toBeInTheDocument();
  });

  it('applique color success par défaut avec classes tailwind', () => {
    renderCard();
    expect(iconWrapper()).toHaveClass('bg-success-soft');
    expect(iconWrapper()).toHaveClass('text-success');
  });

  it('applique color slate avec classes tailwind', () => {
    renderCard({ color: 'slate' });
    expect(iconWrapper()).toHaveClass('bg-surface-hover');
    expect(iconWrapper()).toHaveClass('text-muted');
  });

  it('applique tone success avec variables CSS', () => {
    renderCard({ tone: 'success' });
    expect(iconWrapper()).toHaveClass('bg-[var(--success-soft)]');
    expect(iconWrapper()).toHaveClass('text-[var(--success)]');
  });

  it('applique tone neutral avec variables CSS', () => {
    renderCard({ tone: 'neutral' });
    expect(iconWrapper()).toHaveClass('bg-[var(--bg-surface-hover)]');
    expect(iconWrapper()).toHaveClass('text-[var(--text-secondary)]');
  });

  it('tone l\'emporte sur color quand les deux sont fournis', () => {
    renderCard({ color: 'slate', tone: 'danger' });
    expect(iconWrapper()).toHaveClass('bg-[var(--danger-soft)]');
    expect(iconWrapper()).toHaveClass('text-[var(--danger)]');
  });

  it('affiche le label de tendance quand fourni', () => {
    renderCard({ trendLabel: 'Hausse de 5 %' });
    expect(screen.getByText('Hausse de 5 %')).toBeInTheDocument();
  });
});
