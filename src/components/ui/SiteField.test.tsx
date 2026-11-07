import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteField } from './SiteField';
import { useSite } from '@/lib/SiteContext';

vi.mock('@/lib/SiteContext', () => ({
  useSite: vi.fn(),
}));
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Lock: (props: any) => <span data-testid="icon-lock" {...props} />,
  };
});

const mockUseSite = vi.mocked(useSite);

beforeEach(() => {
  mockUseSite.mockReturnValue({
    availableSites: [],
    currentSiteId: null,
  } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SiteField', () => {
  it('cas A — 1 site : input readonly avec le nom, pas de select', () => {
    mockUseSite.mockReturnValue({
      availableSites: [{ id: 's1', name: 'Site Nord', code: null }],
      currentSiteId: 's1',
    } as never);

    render(
      <SiteField value={null} onChange={vi.fn()} />,
    );

    expect(screen.getByDisplayValue('Site Nord')).toHaveAttribute('readOnly');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('cas B — multi + currentSiteId : select pré-sélectionné', () => {
    mockUseSite.mockReturnValue({
      availableSites: [
        { id: 's1', name: 'Site Nord', code: null },
        { id: 's2', name: 'Site Sud', code: null },
      ],
      currentSiteId: 's1',
    } as never);

    const onChange = vi.fn();
    render(
      <SiteField value={'s1'} onChange={onChange} required />,
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('s1');
    expect(screen.getByText(/Site Nord/)).toBeInTheDocument();
    expect(screen.getByText(/Site Sud/)).toBeInTheDocument();
  });

  it('cas C — multi + tous les sites : select vide — Choisir un site —', () => {
    mockUseSite.mockReturnValue({
      availableSites: [
        { id: 's1', name: 'Site Nord', code: null },
        { id: 's2', name: 'Site Sud', code: null },
      ],
      currentSiteId: null,
    } as never);

    render(
      <SiteField value={null} onChange={vi.fn()} />,
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('');
    expect(screen.getByText('— Choisir un site —')).toBeInTheDocument();
  });

  it('cas D — 0 site : message Aucun site disponible', () => {
    mockUseSite.mockReturnValue({
      availableSites: [],
      currentSiteId: null,
    } as never);

    render(
      <SiteField value={null} onChange={vi.fn()} />,
    );

    expect(screen.getByPlaceholderText(/Aucun site disponible/)).toBeInTheDocument();
    expect(screen.getByText(/Créez un site dans Configuration → Sites/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeDisabled();
  });
});
