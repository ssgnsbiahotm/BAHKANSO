import { describe, it, expect } from 'vitest';
import { parsePeriod } from './format';

describe('parsePeriod', () => {
  it('parse une période valide YYYY-MM', () => {
    const result = parsePeriod('2026-10');
    expect(result).toEqual({
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
    });
  });

  it('gère février bissextile', () => {
    const result = parsePeriod('2024-02');
    expect(result?.periodEnd).toBe('2024-02-29');
  });

  it('gère février non bissextile', () => {
    const result = parsePeriod('2025-02');
    expect(result?.periodEnd).toBe('2025-02-28');
  });

  it('rejette une période incomplète (pas de mois)', () => {
    expect(parsePeriod('2026')).toBeNull();
  });

  it('rejette une période vide', () => {
    expect(parsePeriod('')).toBeNull();
  });

  it('rejette un mois hors bornes (13)', () => {
    expect(parsePeriod('2026-13')).toBeNull();
  });

  it('rejette un mois à 0', () => {
    expect(parsePeriod('2026-00')).toBeNull();
  });

  it('rejette une valeur non numérique', () => {
    expect(parsePeriod('abc-def')).toBeNull();
  });

  it('rejette des parties de longueur incorrecte', () => {
    expect(parsePeriod('26-10')).toBeNull();
    expect(parsePeriod('2026-1')).toBeNull();
  });
});
