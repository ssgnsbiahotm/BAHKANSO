import { supabase } from '@/lib/supabase';
import type { JournalEvent } from '@/lib/types';

/**
 * Source de données du Dashboard v2.
 *
 * Implémentation temporaire (client-side) : interroge event_journal en direct
 * via le client Supabase, sans passer par le DataContext et sans lire la table
 * farms. Remplacée par une RPC SQL au Bloc 2.
 *
 * Un seul passage par ligne par appel (une requête journal par scope, filtres
 * serveur farm_id + fenêtre de dates, colonnes explicites, pas SELECT *).
 */
export interface DashboardDataSource {
  getKpis: (
    farmIds: string[],
    periodStart: string,
    periodEnd: string
  ) => Promise<KpiRaw>;
  getTrend: (
    farmIds: string[],
    months: number
  ) => Promise<TrendPoint[]>;
  getActions: () => Promise<ActionItem[]>;
  getRecent: (
    farmIds: string[],
    limit: number
  ) => Promise<JournalEvent[]>;
}

export interface KpiRaw {
  entrees: number;
  sorties: number;
  recoltes: { quantity: number; campaignId: string | null }[];
  alertesOuvertes: number;
}

export interface TrendPoint {
  month: string; // 'YYYY-MM'
  entrees: number;
  sorties: number;
}

export interface ActionItem {
  id: string;
  title: string;
  href: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Implémentation client-side de la source de données.
 *
 * Scopage : farm_ids résolus depuis le site sélectionné
 * (sites.find(s => s.id === siteId)?.farm_id). Pas de lecture de farms.
 */
export class ClientDataSource implements DashboardDataSource {
  async getKpis(
    farmIds: string[],
    periodStart: string,
    periodEnd: string
  ): Promise<KpiRaw> {
    if (farmIds.length === 0) {
      return { entrees: 0, sorties: 0, recoltes: [], alertesOuvertes: 0 };
    }

    const { data, error } = await supabase
      .from('event_journal')
      .select('event_type, amount, quantity, context, occurred_at')
      .in('farm_id', farmIds)
      .gte('occurred_at', periodStart)
      .lte('occurred_at', periodEnd)
      .order('occurred_at', { ascending: false });

    if (error || !data) {
      return { entrees: 0, sorties: 0, recoltes: [], alertesOuvertes: 0 };
    }

    const raw = data as unknown as JournalEvent[];

    let entrees = 0;
    let sorties = 0;
    const recoltes: { quantity: number; campaignId: string | null }[] = [];

    for (const e of raw) {
      const amount = Number(e.amount || 0);
      const quantity = Number(e.quantity || 0);
      const context = (e.context as { campaign_id?: string }) || {};
      const campaignId = context.campaign_id ?? null;

      if (e.event_type === 'recette') {
        entrees += amount;
      } else if (e.event_type === 'depense') {
        sorties += amount;
      }
      if (e.event_type === 'recolte' && quantity > 0) {
        recoltes.push({ quantity, campaignId });
      }
    }

    return { entrees, sorties, recoltes, alertesOuvertes: 0 };
  }

  async getTrend(
    farmIds: string[],
    months: number
  ): Promise<TrendPoint[]> {
    if (farmIds.length === 0) return [];

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const periodStart = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from('event_journal')
      .select('event_type, amount, occurred_at')
      .in('farm_id', farmIds)
      .gte('occurred_at', periodStart)
      .order('occurred_at', { ascending: true });

    if (error || !data) return [];

    const raw = data as unknown as JournalEvent[];
    const byMonth: Record<string, { entrees: number; sorties: number }> = {};

    for (const e of raw) {
      const month = e.occurred_at.slice(0, 7); // 'YYYY-MM'
      if (!byMonth[month]) byMonth[month] = { entrees: 0, sorties: 0 };
      const amount = Number(e.amount || 0);
      if (e.event_type === 'recette') byMonth[month].entrees += amount;
      else if (e.event_type === 'depense') byMonth[month].sorties += amount;
    }

    return Object.entries(byMonth).map(([month, v]) => ({
      month,
      entrees: v.entrees,
      sorties: v.sorties,
    }));
  }

  async getActions(): Promise<ActionItem[]> {
    // Les actions proviennent de la table alerts (même source que la cloche/Sidebar).
    // Implémentation provisoire : vide, remplacée par le DataContext dans useDashboardData.
    return [];
  }

  async getRecent(
    farmIds: string[],
    limit: number
  ): Promise<JournalEvent[]> {
    if (farmIds.length === 0) return [];

    const { data, error } = await supabase
      .from('event_journal')
      .select('*')
      .in('farm_id', farmIds)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as unknown as JournalEvent[];
  }
}

export const clientDataSource = new ClientDataSource();
