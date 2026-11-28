import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('./DataContext', () => ({ useData: () => ({ sites: [] }) }));

import { useAuth } from './AuthContext';
import { SiteProvider } from './SiteContext';

const mockAppUser = (role: string, site_id: string | null) => {
  vi.mocked(useAuth).mockReturnValue({ appUser: { id: 'u1', role, site_id } } as never);
};

describe('SiteProvider — garde site_id', () => {
  it('affiche "Aucun site assigné" pour un comptable sans site', () => {
    mockAppUser('comptable', null);
    render(<SiteProvider><div>Contenu</div></SiteProvider>);
    expect(screen.getByText(/Aucun site assigné/i)).toBeInTheDocument();
  });

  it('affiche le contenu pour un propriétaire sans site (exempté)', () => {
    mockAppUser('propriétaire', null);
    render(<SiteProvider><div>Contenu</div></SiteProvider>);
    expect(screen.getByText('Contenu')).toBeInTheDocument();
  });

  it('affiche le contenu pour un comptable avec site', () => {
    mockAppUser('comptable', 'site-123');
    render(<SiteProvider><div>Contenu</div></SiteProvider>);
    expect(screen.getByText('Contenu')).toBeInTheDocument();
  });
});
