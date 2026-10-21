import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSurveillance, useSurveillanceMutations, isOverdue, getTypeLabel, getStatusLabel, getStatusColor, getTypeColor } from './useSurveillance';
import type { SurveillanceEvent } from '@/lib/types';

// Mock usePaginatedQuery
vi.mock('./usePaginatedQuery', () => ({
  usePaginatedQuery: vi.fn(),
}));

// Mock useAsyncAction
vi.mock('./useAsyncAction', () => ({
  useAsyncAction: vi.fn(),
}));

// Mock useToast
vi.mock('@/lib/Toast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  })),
}));

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

import { usePaginatedQuery } from './usePaginatedQuery';
import { useAsyncAction } from './useAsyncAction';
import { supabase } from '@/lib/supabase';

const mockUsePaginatedQuery = vi.mocked(usePaginatedQuery);
const mockUseAsyncAction = vi.mocked(useAsyncAction);
const mockSupabase = vi.mocked(supabase);

// Helper to create a complete mock SurveillanceEvent for testing
const createMockEvent = (overrides: Partial<SurveillanceEvent> = {}): SurveillanceEvent => ({
  id: 'evt-1',
  farm_id: 'test-farm-id',
  type: 'phyto_traitement',
  label: 'Test',
  description: null,
  scheduled_at: new Date().toISOString(),
  completed_at: null,
  status: 'planifie',
  cost_amount: null,
  responsible_id: null,
  plot_id: null,
  campaign_id: null,
  lot_id: null,
  animal_id: null,
  project_id: null,
  details: {},
  deleted_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  plot: null,
  campaign: null,
  lot: null,
  animal: null,
  project: null,
  responsible: null,
  ...overrides,
});

describe('useSurveillance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePaginatedQuery.mockReturnValue({
      data: {
        data: [],
        count: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
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
  });

  it('should call usePaginatedQuery with correct parameters', () => {
    renderHook(() => useSurveillance({ type: 'phyto_traitement' }, 1, 10));

    expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'surveillance_events',
        page: 1,
        pageSize: 10,
        orderBy: { column: 'scheduled_at', ascending: false },
      })
    );
  });

  it('should include deleted_at IS NULL filter by default', () => {
    renderHook(() => useSurveillance({}, 1, 10));

    const callArgs = mockUsePaginatedQuery.mock.calls[0][0];
    const filters = callArgs.filters ?? [];
    const deletedAtFilter = filters.find(f => f.column === 'deleted_at');
    expect(deletedAtFilter).toEqual({ column: 'deleted_at', operation: 'is', value: null });
  });

  it('should add type filter when provided', () => {
    renderHook(() => useSurveillance({ type: 'phyto_traitement' }, 1, 10));

    const callArgs = mockUsePaginatedQuery.mock.calls[0][0];
    const filters = callArgs.filters ?? [];
    const typeFilter = filters.find(f => f.column === 'type');
    expect(typeFilter).toEqual({ column: 'type', operation: 'eq', value: 'phyto_traitement' });
  });

  it('should add status filter when provided', () => {
    renderHook(() => useSurveillance({ status: 'planifie' }, 1, 10));

    const callArgs = mockUsePaginatedQuery.mock.calls[0][0];
    const filters = callArgs.filters ?? [];
    const statusFilter = filters.find(f => f.column === 'status');
    expect(statusFilter).toEqual({ column: 'status', operation: 'eq', value: 'planifie' });
  });

  it('should add plotId filter when provided', () => {
    renderHook(() => useSurveillance({ plotId: 'plot-123' }, 1, 10));

    const callArgs = mockUsePaginatedQuery.mock.calls[0][0];
    const filters = callArgs.filters ?? [];
    const plotFilter = filters.find(f => f.column === 'plot_id');
    expect(plotFilter).toEqual({ column: 'plot_id', operation: 'eq', value: 'plot-123' });
  });
});

describe('useSurveillanceMutations', () => {
  const mockExecuteAction = vi.fn();
  const mockLoading = false;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAsyncAction.mockReturnValue({
      loading: mockLoading,
      executeAction: mockExecuteAction,
    });
  });

  it('should create event with correct parameters', async () => {
    const mockEvent = { id: 'evt-1', type: 'phyto_traitement', label: 'Test', status: 'planifie' };
    mockExecuteAction.mockResolvedValue(mockEvent);

    const { result } = renderHook(() => useSurveillanceMutations());
    const created = await result.current.create({
      type: 'phyto_traitement',
      label: 'Test',
      scheduled_at: '2026-10-20T10:00:00Z',
      farm_id: 'test-farm-id',
    });

    expect(created).toEqual(mockEvent);
    expect(mockExecuteAction).toHaveBeenCalled();
  });

  it('should return null when create fails', async () => {
    mockExecuteAction.mockResolvedValue(null);

    const { result } = renderHook(() => useSurveillanceMutations());
    const created = await result.current.create({
      type: 'phyto_traitement',
      label: 'Test',
      scheduled_at: '2026-10-20T10:00:00Z',
      farm_id: 'test-farm-id',
    });

    expect(created).toBeNull();
  });

  it('should update event with correct parameters', async () => {
    const mockEvent = { id: 'evt-1', type: 'phyto_traitement', label: 'Updated', status: 'planifie' };
    mockExecuteAction.mockResolvedValue(mockEvent);

    const { result } = renderHook(() => useSurveillanceMutations());
    const updated = await result.current.update('evt-1', { label: 'Updated' });

    expect(updated).toEqual(mockEvent);
    expect(mockExecuteAction).toHaveBeenCalled();
  });

  it('should mark event as completed', async () => {
    const mockEvent = { id: 'evt-1', status: 'termine', completed_at: '2026-10-20T12:00:00Z' };
    mockExecuteAction.mockResolvedValue(mockEvent);

    const { result } = renderHook(() => useSurveillanceMutations());
    const updated = await result.current.markCompleted('evt-1');

    expect(updated).toEqual(mockEvent);
    expect(mockExecuteAction).toHaveBeenCalled();
  });

  it('should soft delete event', async () => {
    mockExecuteAction.mockResolvedValue(true);

    const { result } = renderHook(() => useSurveillanceMutations());
    const deleted = await result.current.softDelete('evt-1');

    expect(deleted).toBe(true);
    expect(mockExecuteAction).toHaveBeenCalled();
  });

  it('should return false when soft delete fails', async () => {
    mockExecuteAction.mockResolvedValue(false);

    const { result } = renderHook(() => useSurveillanceMutations());
    const deleted = await result.current.softDelete('evt-1');

    expect(deleted).toBe(false);
  });
});

describe('isOverdue', () => {
  it('should return true for planifie event in the past', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
    const event = createMockEvent({ status: 'planifie', scheduled_at: pastDate });
    expect(isOverdue(event)).toBe(true);
  });

  it('should return false for planifie event in the future', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
    const event = createMockEvent({ status: 'planifie', scheduled_at: futureDate });
    expect(isOverdue(event)).toBe(false);
  });

  it('should return false for en_cours event', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const event = createMockEvent({ status: 'en_cours', scheduled_at: pastDate });
    expect(isOverdue(event)).toBe(false);
  });

  it('should return false for termine event', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const event = createMockEvent({ status: 'termine', scheduled_at: pastDate });
    expect(isOverdue(event)).toBe(false);
  });

  it('should return false for annule event', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const event = createMockEvent({ status: 'annule', scheduled_at: pastDate });
    expect(isOverdue(event)).toBe(false);
  });
});

describe('getTypeLabel', () => {
  it('should return correct label for phyto_traitement', () => {
    expect(getTypeLabel('phyto_traitement')).toBe('Traitement phytosanitaire');
  });

  it('should return correct label for equip_panne', () => {
    expect(getTypeLabel('equip_panne')).toBe('Panne équipement');
  });
});

describe('getStatusLabel', () => {
  it('should return correct label for planifie', () => {
    expect(getStatusLabel('planifie')).toBe('Planifié');
  });

  it('should return correct label for en_cours', () => {
    expect(getStatusLabel('en_cours')).toBe('En cours');
  });

  it('should return correct label for termine', () => {
    expect(getStatusLabel('termine')).toBe('Terminé');
  });

  it('should return correct label for annule', () => {
    expect(getStatusLabel('annule')).toBe('Annulé');
  });
});

describe('getStatusColor', () => {
  it('should return correct color for planifie', () => {
    expect(getStatusColor('planifie')).toBe('bg-blue-100 text-blue-700');
  });

  it('should return correct color for en_cours', () => {
    expect(getStatusColor('en_cours')).toBe('bg-amber-100 text-amber-700');
  });

  it('should return correct color for termine', () => {
    expect(getStatusColor('termine')).toBe('bg-green-100 text-green-700');
  });

  it('should return correct color for annule', () => {
    expect(getStatusColor('annule')).toBe('bg-slate-100 text-slate-700');
  });
});

describe('getTypeColor', () => {
  it('should return correct color for phyto_traitement', () => {
    expect(getTypeColor('phyto_traitement')).toBe('bg-green-100 text-green-700');
  });

  it('should return correct color for equip_panne', () => {
    expect(getTypeColor('equip_panne')).toBe('bg-red-100 text-red-700');
  });
});