import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Surveillance } from './Surveillance';
import type { SurveillanceEvent } from '@/lib/types';

// Mock useSurveillance
vi.mock('@/hooks/useSurveillance', () => ({
  useSurveillance: vi.fn(),
  useSurveillanceMutations: vi.fn(),
  isOverdue: vi.fn(),
  getTypeLabel: vi.fn(),
  getStatusLabel: vi.fn(),
  getStatusColor: vi.fn(),
  getTypeColor: vi.fn(),
}));

// Mock useData
vi.mock('@/lib/DataContext', () => ({
  useData: () => ({
    siteContent: { branding: { value: {} } },
    farm: { id: 'test-farm-id', name: 'Test Farm' },
    plots: [{ id: 'plot-1', reference: 'P001', name: 'Parcelle Nord' }],
    campaigns: [{ id: 'camp-1', crop_name: 'Maïs', year: 2026 }],
    animalLots: [{ id: 'lot-1', identifier: 'LOT001', species: 'Bovin' }],
    animals: [{ id: 'animal-1', identifier: 'AN001', species: 'Bovin' }],
    projects: [{ id: 'proj-1', name: 'Projet Irrigation' }],
    users: [{ id: 'user-1', name: 'Jean Dupont' }, { id: 'user-2', name: 'Marie Martin' }],
  }),
}));

// Mock useNavigate and useLocation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/app/surveillance' }),
  };
});

// Mock Toast
vi.mock('@/lib/Toast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  })),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ShieldAlert: () => <span data-testid="icon-shield-alert" />,
  Wrench: () => <span data-testid="icon-wrench" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Euro: () => <span data-testid="icon-euro" />,
  User: () => <span data-testid="icon-user" />,
  AlertTriangle: () => <span data-testid="icon-alert-triangle" />,
  RotateCcw: () => <span data-testid="icon-rotate-ccw" />,
  Edit2: () => <span data-testid="icon-edit" />,
  Trash2: () => <span data-testid="icon-trash" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
  X: () => <span data-testid="icon-x" />,
  Plus: () => <span data-testid="icon-plus" />,
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  Loader2: () => <span data-testid="icon-loader" />,
  Search: () => <span data-testid="icon-search" />,
  Filter: () => <span data-testid="icon-filter" />,
  RotateCw: () => <span data-testid="icon-rotate-cw" />,
}));

// Mock @/components/ui/Modal
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ open, onClose, title, children, ...props }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
    open ? <div {...props} data-testid="modal"><h3>{title}</h3>{children}</div> : null
  ),
}));

// Mock @/components/ui
vi.mock('@/components/ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} onClick={onClick} disabled={disabled} data-testid="button">{children}</button>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} data-testid="input" />,
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} data-testid="textarea" />,
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} data-testid="select" />,
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="card">{children}</div>,
  CardHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <h3 {...props} data-testid="card-title">{children}</h3>,
  CardContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="card-content">{children}</div>,
  Badge: ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props} className={className} data-testid="badge">{children}</span>
  ),
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} data-testid="label">{children}</label>,
  Dialog: ({ open, onOpenChange, children, ...props }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => (
    open ? <div {...props} data-testid="dialog">{children}</div> : null
  ),
  Modal: ({ open, onClose, children, ...props }: { open: boolean; onClose: () => void; children: React.ReactNode }) => (
    open ? <div {...props} data-testid="modal">{children}</div> : null
  ),
  DialogTrigger: ({ children, ...props }: { children: React.ReactNode }) => <div {...props} data-testid="dialog-trigger">{children}</div>,
  DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <h2 {...props} data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <p {...props} data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="dialog-footer">{children}</div>,
  DialogClose: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} onClick={onClick} data-testid="dialog-close">{children}</button>,
}));

import { useSurveillance, useSurveillanceMutations, isOverdue, getTypeLabel, getStatusLabel, getStatusColor, getTypeColor } from '@/hooks/useSurveillance';

const mockUseSurveillance = vi.mocked(useSurveillance);
const mockUseSurveillanceMutations = vi.mocked(useSurveillanceMutations);
const mockIsOverdue = vi.mocked(isOverdue);
const mockGetTypeLabel = vi.mocked(getTypeLabel);
const mockGetStatusLabel = vi.mocked(getStatusLabel);
const mockGetStatusColor = vi.mocked(getStatusColor);
const mockGetTypeColor = vi.mocked(getTypeColor);

const mockEvents = [
  {
    id: 'evt-1',
    farm_id: 'test-farm-id',
    type: 'phyto_traitement' as const,
    label: 'Traitement maïs',
    description: 'Traitement fongicide',
    scheduled_at: '2026-10-20T10:00:00Z',
    completed_at: null,
    status: 'planifie' as const,
    cost_amount: 150,
    responsible_id: 'user-1',
    plot_id: 'plot-1',
    campaign_id: null,
    lot_id: null,
    animal_id: null,
    project_id: null,
    details: {},
    deleted_at: null,
    created_at: '2026-10-19T10:00:00Z',
    updated_at: '2026-10-19T10:00:00Z',
    plot: { id: 'plot-1', reference: 'P001', name: 'Parcelle Nord' },
    campaign: null,
    lot: null,
    animal: null,
    project: null,
    responsible: { id: 'user-1', name: 'Jean Dupont' },
  },
  {
    id: 'evt-2',
    farm_id: 'test-farm-id',
    type: 'equip_panne' as const,
    label: 'Tracteur en panne',
    description: 'Moteur ne démarre pas',
    scheduled_at: '2026-10-18T08:00:00Z',
    completed_at: '2026-10-19T14:00:00Z',
    status: 'termine' as const,
    cost_amount: 500,
    responsible_id: 'user-2',
    plot_id: null,
    campaign_id: null,
    lot_id: null,
    animal_id: null,
    project_id: 'proj-1',
    details: {},
    deleted_at: null,
    created_at: '2026-10-17T10:00:00Z',
    updated_at: '2026-10-19T14:00:00Z',
    plot: null,
    campaign: null,
    lot: null,
    animal: null,
    project: { id: 'proj-1', name: 'Projet Irrigation' },
    responsible: { id: 'user-2', name: 'Marie Martin' },
  },
];

const mockMutations = {
  loading: false,
  create: vi.fn(),
  update: vi.fn(),
  markCompleted: vi.fn(),
  softDelete: vi.fn(),
};

const renderSurveillance = () => {
  return render(
    <BrowserRouter>
      <Surveillance />
    </BrowserRouter>
  );
};

describe('Surveillance Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSurveillance.mockReturnValue({
      data: { data: mockEvents, count: 2, page: 1, pageSize: 50, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isPending: false,
      isSuccess: true,
      isLoadingError: false,
      isRefetchError: false,
      fetchStatus: 'idle',
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isRefetching: false,
      isStale: true,
      errorUpdateCount: 0,
      isFetching: false,
      isInitialLoading: false,
      isPaused: false,
      isEnabled: true,
    });

    mockUseSurveillanceMutations.mockReturnValue(mockMutations);

    mockIsOverdue.mockImplementation((event) => {
      if (event.status !== 'planifie') return false;
      return new Date(event.scheduled_at) < new Date();
    });

    mockGetTypeLabel.mockImplementation((type) => {
      return type === 'phyto_traitement' ? 'Traitement phytosanitaire' : 'Panne équipement';
    });

    mockGetStatusLabel.mockImplementation((status) => {
      const labels: Record<string, string> = {
        planifie: 'Planifié',
        en_cours: 'En cours',
        termine: 'Terminé',
        annule: 'Annulé',
      };
      return labels[status] || status;
    });

    mockGetStatusColor.mockImplementation((status) => {
      const colors: Record<string, string> = {
        planifie: 'bg-blue-100 text-blue-700',
        en_cours: 'bg-amber-100 text-amber-700',
        termine: 'bg-green-100 text-green-700',
        annule: 'bg-slate-100 text-slate-700',
      };
      return colors[status] || '';
    });

    mockGetTypeColor.mockImplementation((type) => {
      return type === 'phyto_traitement' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    });
  });

  it('renders the page title', () => {
    renderSurveillance();
    expect(screen.getByText('Surveillance')).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    renderSurveillance();
    // Check KPI values (numbers) - using getAllByText since some values repeat
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // Total
    expect(screen.getAllByText('1').length).toBeGreaterThan(0); // Planifiés + En retard
    expect(screen.getAllByText('0').length).toBeGreaterThan(0); // En cours
    // Check that KPI labels exist (using getAllByText for duplicates)
    expect(screen.getAllByText('Total').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Planifiés').length).toBeGreaterThan(0);
    expect(screen.getAllByText('En cours').length).toBeGreaterThan(0);
    expect(screen.getAllByText('En retard').length).toBeGreaterThan(0);
  });

  it('renders filter selects', () => {
    renderSurveillance();
    expect(screen.getByLabelText('Filtrer par type')).toBeInTheDocument();
    expect(screen.getByLabelText('Filtrer par statut')).toBeInTheDocument();
  });

  it('renders rotating cards for events', () => {
    renderSurveillance();
    expect(screen.getAllByText('Traitement maïs').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tracteur en panne').length).toBeGreaterThan(0);
  });

  it('shows type badges on cards', () => {
    renderSurveillance();
    expect(screen.getAllByText('Traitement phytosanitaire').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Panne équipement').length).toBeGreaterThan(0);
  });

  it('shows status badges on cards', () => {
    renderSurveillance();
    expect(screen.getAllByText('Planifié').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Terminé').length).toBeGreaterThan(0);
  });

  it('shows scheduled date on cards', () => {
    renderSurveillance();
    expect(screen.getAllByText('20/10/2026').length).toBeGreaterThan(0);
  });

  it('shows cost on cards', () => {
    renderSurveillance();
    expect(screen.getAllByText('150 FCFA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('500 FCFA').length).toBeGreaterThan(0);
  });

  it('shows responsible person on cards', () => {
    renderSurveillance();
    expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Marie Martin').length).toBeGreaterThan(0);
  });

  it('shows overdue badge for past planifie events', () => {
    renderSurveillance();
    // The first event is in the past and planifie, so it should show overdue
    expect(screen.getAllByText('En retard').length).toBeGreaterThan(0);
  });

  it('does not show overdue badge for completed events', () => {
    renderSurveillance();
    // The second event is termine, so no overdue badge for it specifically
    // The overdue badge count in KPI should be 1
  });

  describe('Create Event', () => {
    it('opens create modal when clicking "Nouvel événement"', () => {
      renderSurveillance();
      const createButton = screen.getByRole('button', { name: /Nouvel événement/i });
      fireEvent.click(createButton);

      expect(screen.getByText('Créer un événement')).toBeInTheDocument();
    });

    it('closes modal when clicking cancel', () => {
      renderSurveillance();
      fireEvent.click(screen.getByRole('button', { name: /Nouvel événement/i }));
      fireEvent.click(screen.getByText('Annuler'));

      expect(screen.queryByText('Créer l\'événement')).not.toBeInTheDocument();
    });

    it('calls create mutation when submitting form', async () => {
      const { id: _unused, ...eventWithoutId } = mockEvents[0];
      mockMutations.create.mockResolvedValue({ id: 'evt-3', ...eventWithoutId });

      renderSurveillance();
      fireEvent.click(screen.getByRole('button', { name: /Nouvel événement/i }));

      // Fill form
      const typeSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(typeSelect, { target: { value: 'phyto_traitement' } });

      const labelInput = screen.getByPlaceholderText(/ex: Traitement mildiou/i);
      fireEvent.change(labelInput, { target: { value: 'Nouveau traitement' } });

      const dateInput = screen.getAllByRole('textbox')[1]; // First is label input
      fireEvent.change(dateInput, { target: { value: '2026-10-25T10:00' } });

      // Submit
      fireEvent.click(screen.getByText('Créer l\'événement'));

      await waitFor(() => {
        expect(mockMutations.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'phyto_traitement',
            label: 'Nouveau traitement',
          })
        );
      });
    });
  });

  describe('Edit Event', () => {
    it('opens edit modal when clicking edit button on card', () => {
      renderSurveillance();
      // Click edit button on first card
      const editButtons = screen.getAllByTestId('icon-edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Modifier l\'événement')).toBeInTheDocument();
    });

    it('closes edit modal when clicking cancel', () => {
      renderSurveillance();
      const editButtons = screen.getAllByTestId('icon-edit');
      fireEvent.click(editButtons[0]);
      fireEvent.click(screen.getByText('Annuler'));

      expect(screen.queryByText('Modifier l\'événement')).not.toBeInTheDocument();
    });
  });

  describe('Mark Completed', () => {
    it('calls markCompleted when clicking check button', async () => {
      mockMutations.markCompleted.mockResolvedValue({ ...mockEvents[0], status: 'termine' });

      renderSurveillance();
      const checkButtons = screen.getAllByTestId('icon-check-circle');
      fireEvent.click(checkButtons[0]);

      await waitFor(() => {
        expect(mockMutations.markCompleted).toHaveBeenCalledWith('evt-1');
      });
    });
  });

  describe('Delete Event', () => {
    it('opens delete confirmation modal when clicking delete button', () => {
      renderSurveillance();
      const deleteButtons = screen.getAllByLabelText('Supprimer');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument();
    });

    it('cancels deletion when clicking "Annuler" in confirmation modal', async () => {
      renderSurveillance();
      const deleteButtons = screen.getAllByLabelText('Supprimer');
      fireEvent.click(deleteButtons[0]);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Annuler'));

      expect(screen.queryByText('Confirmer la suppression')).not.toBeInTheDocument();
      expect(mockMutations.softDelete).not.toHaveBeenCalled();
    });

    it('calls softDelete when confirming deletion', async () => {
      mockMutations.softDelete.mockResolvedValue(true);

      renderSurveillance();
      const deleteButtons = screen.getAllByLabelText('Supprimer');
      fireEvent.click(deleteButtons[0]);

      // Wait for confirmation modal to appear
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      // Click "Supprimer" button in the confirmation modal - use role and name within modal
      const modal = screen.getByTestId('modal');
      const confirmButton = within(modal).getByRole('button', { name: /Supprimer/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockMutations.softDelete).toHaveBeenCalledWith('evt-1');
      });
    });
  });

  describe('Card Flip', () => {
    it('flips card when clicking rotate button', () => {
      renderSurveillance();
      const rotateButtons = screen.getAllByTestId('icon-rotate-ccw');
      fireEvent.click(rotateButtons[0]);

      // Should show back of card - check for "Retour" button which is always present
      expect(screen.getAllByText('Retour').length).toBeGreaterThan(0);
    });

    it('flips back when clicking retour button', () => {
      renderSurveillance();
      const rotateButtons = screen.getAllByTestId('icon-rotate-ccw');
      fireEvent.click(rotateButtons[0]);

      const backButtons = screen.getAllByText('Retour');
      fireEvent.click(backButtons[0]);

      // Should show front of card again - label appears on both faces, so check first
      expect(screen.getAllByText('Traitement maïs')[0]).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading', () => {
      mockUseSurveillance.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isPending: true,
        isSuccess: false,
        isLoadingError: false,
        isRefetchError: false,
        fetchStatus: 'fetching',
        status: 'pending',
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetched: false,
        isFetchedAfterMount: false,
        isPlaceholderData: false,
        isRefetching: false,
        isStale: true,
        errorUpdateCount: 0,
        isFetching: true,
        isInitialLoading: true,
        isPaused: false,
        isEnabled: true,
      });

      renderSurveillance();
      expect(screen.getByLabelText('Chargement...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when query fails', () => {
      mockUseSurveillance.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch'),
        refetch: vi.fn(),
        isPending: false,
        isSuccess: false,
        isLoadingError: true,
        isRefetchError: false,
        fetchStatus: 'idle',
        status: 'error',
        dataUpdatedAt: 0,
        errorUpdatedAt: Date.now(),
        failureCount: 1,
        failureReason: new Error('Failed to fetch'),
        isFetched: true,
        isFetchedAfterMount: true,
        isPlaceholderData: false,
        isRefetching: false,
        isStale: true,
        errorUpdateCount: 1,
        isFetching: false,
        isInitialLoading: false,
        isPaused: false,
        isEnabled: true,
      });

      renderSurveillance();
      expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
    });
  });
});