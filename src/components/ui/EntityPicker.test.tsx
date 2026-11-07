import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EntityPicker } from './EntityPicker';
import { useData } from '@/lib/DataContext';

vi.mock('@/lib/DataContext', () => ({
  useData: vi.fn(),
}));

const mockUseData = vi.mocked(useData);

function renderPicker(
  entityType: 'funder' | 'supplier' = 'funder',
  props: Partial<Parameters<typeof EntityPicker>[0]> = {},
) {
  return render(
    <EntityPicker
      label="Fournisseur"
      entityType={entityType}
      value={null}
      onChange={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  mockUseData.mockReturnValue({
    funders: [
      { id: 'f1', name: 'AgriDistrib', active: true },
      { id: 'f2', name: 'SemencesPlus', active: true },
    ],
    suppliers: [
      { id: 's1', name: 'Fournisseur A', category: 'Engrais' },
      { id: 's2', name: 'Fournisseur B', category: 'Semences' },
    ],
  } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EntityPicker', () => {
  it('rend le label, l\'input et le placeholder', () => {
    renderPicker();
    expect(screen.getByLabelText('Fournisseur')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Rechercher…')).toBeInTheDocument();
  });

  it('met à jour la sélection via onChange', async () => {
    const onChange = vi.fn();
    render(
      <EntityPicker
        label="Fournisseur"
        entityType="funder"
        value={null}
        onChange={onChange}
      />,
    );

    const input = screen.getByPlaceholderText('Rechercher…');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Agri' } });

    await waitFor(() => {
      expect(screen.getByText('AgriDistrib', { selector: '[role="option"]' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('AgriDistrib', { selector: '[role="option"]' }));

    expect(onChange).toHaveBeenCalledWith('f1');
  });

  it('sélectionne le premier item avec ArrowDown puis Enter', async () => {
    const onChange = vi.fn();
    render(
      <EntityPicker
        label="Fournisseur"
        entityType="funder"
        value={null}
        onChange={onChange}
      />,
    );

    const input = screen.getByPlaceholderText('Rechercher…');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Agri' } });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('f1');
  });
});
