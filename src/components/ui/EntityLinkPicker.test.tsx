import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EntityLinkPicker } from './EntityLinkPicker';
import { useData } from '@/lib/DataContext';

vi.mock('@/lib/DataContext', () => ({
  useData: vi.fn(),
}));
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Plus: (props: any) => <span data-testid="icon-plus" {...props} />,
    X: (props: any) => <span data-testid="icon-x" {...props} />,
    AlertCircle: (props: any) => <span data-testid="icon-alert" {...props} />,
    CheckCircle2: (props: any) => <span data-testid="icon-check" {...props} />,
  };
});

const mockUseData = vi.mocked(useData);

beforeEach(() => {
  mockUseData.mockReturnValue({
    funders: [{ id: 'f1', name: 'AgriDistrib' }],
    suppliers: [{ id: 's1', name: 'Fournisseur A' }],
  } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EntityLinkPicker', () => {
  it('affiche l\'état vide avec le bouton ajouter', () => {
    render(
      <EntityLinkPicker
        links={[]}
        onChange={vi.fn()}
        totalAmount={1000}
        allowedTypes={['supplier', 'funder']}
      />,
    );
    expect(screen.getByText(/Aucun lien/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajouter un lien/ })).toBeInTheDocument();
  });

  it('ajoute une ligne quand on clique sur ajouter', () => {
    const onChange = vi.fn();
    render(
      <EntityLinkPicker
        links={[]}
        onChange={onChange}
        totalAmount={1000}
        allowedTypes={['supplier', 'funder']}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un lien/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const [nextLinks] = onChange.mock.calls[0];
    expect(nextLinks).toHaveLength(1);
    expect(nextLinks[0].entity_type).toBe('supplier');
    expect(nextLinks[0].entity_id).toBe('');
    expect(nextLinks[0].amount_allocated).toBe(0);
  });

  it('supprime une ligne quand on clique sur ×', () => {
    const onChange = vi.fn();
    render(
      <EntityLinkPicker
        links={[
          { entity_type: 'supplier', entity_id: 's1', amount_allocated: 500 },
        ]}
        onChange={onChange}
        totalAmount={1000}
        allowedTypes={['supplier', 'funder']}
      />,
    );
    fireEvent.click(screen.getByLabelText('Supprimer le lien'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const [nextLinks] = onChange.mock.calls[0];
    expect(nextLinks).toHaveLength(0);
  });
});
