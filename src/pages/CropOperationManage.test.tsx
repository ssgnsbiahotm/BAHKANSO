import { describe, it, expect } from 'vitest';
import { cropOperationSchema } from './CropOperationManage';

describe('cropOperationSchema — validation campagne/parcelle', () => {
  it('rejette une opération sans campagne et sans parcelle', () => {
    const result = cropOperationSchema.safeParse({
      campaign_id: '',
      plot_id: '',
      date: '2026-10-21',
      type: 'semis',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error as unknown as { issues: Array<{ message: string }> };
      expect(err.issues.some((e) => e.message === 'Une opération doit être liée à au moins une campagne ou une parcelle.')).toBe(true);
    }
  });

  it('accepte une opération avec campagne seule', () => {
    const result = cropOperationSchema.safeParse({
      campaign_id: 'camp-1',
      plot_id: '',
      date: '2026-10-21',
      type: 'semis',
    });
    expect(result.success).toBe(true);
  });

  it('accepte une opération avec parcelle seule', () => {
    const result = cropOperationSchema.safeParse({
      campaign_id: '',
      plot_id: 'plot-1',
      date: '2026-10-21',
      type: 'semis',
    });
    expect(result.success).toBe(true);
  });

  it('accepte une opération avec campagne et parcelle', () => {
    const result = cropOperationSchema.safeParse({
      campaign_id: 'camp-1',
      plot_id: 'plot-1',
      date: '2026-10-21',
      type: 'semis',
    });
    expect(result.success).toBe(true);
  });

  it('rejette quand la date est manquante', () => {
    const result = cropOperationSchema.safeParse({
      campaign_id: 'camp-1',
      plot_id: '',
      date: '',
      type: 'semis',
    });
    expect(result.success).toBe(false);
  });

  it('rejette quand le type est manquant', () => {
    const result = cropOperationSchema.safeParse({
      campaign_id: 'camp-1',
      plot_id: '',
      date: '2026-10-21',
      type: '',
    });
    expect(result.success).toBe(false);
  });

  it("rejette quand aucun des deux liens n'est renseigné (undefined)", () => {
    const result = cropOperationSchema.safeParse({
      campaign_id: undefined,
      plot_id: undefined,
      date: '2026-10-21',
      type: 'semis',
    });
    expect(result.success).toBe(false);
  });
});
