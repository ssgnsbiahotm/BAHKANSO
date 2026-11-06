import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const buildChain = (data: unknown[]) => {
  const lte = vi.fn().mockResolvedValue({ data, error: null });
  const gte = vi.fn().mockReturnValue({ lte });
  const eq = vi.fn().mockReturnValue({ gte });
  const select = vi.fn().mockReturnValue({ eq });
  return { select, eq, gte, lte };
};

describe('calculateMortalityRate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('compte 1 décès sur 10 naissances = 10%', async () => {
    const mockData = Array.from({ length: 9 }, () => ({
      event_type: 'naissance',
      occurred_at: '2026-01-01',
    }));
    mockData.push({ event_type: 'mort', occurred_at: '2026-02-01' });

    const chain = buildChain(mockData);
    const { supabase } = await import('@/lib/supabase');
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: chain.select });

    const { calculateMortalityRate } = await import('./kpi');
    const result = await calculateMortalityRate('farm-1', '2026-01-01', '2026-12-31');

    expect(result).toBeCloseTo(10, 1);
    expect(chain.eq).toHaveBeenCalledWith('farm_id', 'farm-1');
  });

  it('retourne 0 si aucun événement', async () => {
    const chain = buildChain([]);
    const { supabase } = await import('@/lib/supabase');
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: chain.select });

    const { calculateMortalityRate } = await import('./kpi');
    const result = await calculateMortalityRate('farm-1', '2026-01-01', '2026-12-31');

    expect(result).toBe(0);
  });
});
