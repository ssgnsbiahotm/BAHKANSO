import { useMemo } from 'react';
import { usePaginatedQuery } from './usePaginatedQuery';
import { supabase } from '@/lib/supabase';
import { useAsyncAction } from './useAsyncAction';
import { useToast } from '@/lib/Toast';
import type { SurveillanceEvent, SurveillanceEventType, SurveillanceEventStatus } from '@/lib/types';

/**
 * Hook pour lister les événements de surveillance avec filtres.
 * Exclut automatiquement les événements supprimés (deleted_at IS NULL).
 */
export function useSurveillance(
  filters: {
    type?: SurveillanceEventType;
    status?: SurveillanceEventStatus;
    plotId?: string;
    campaignId?: string;
    lotId?: string;
    animalId?: string;
    projectId?: string;
  } = {},
  page = 1,
  pageSize = 50
) {
  const queryFilters = useMemo(() => {
    const f: Array<{ column: string; operation: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is'; value: unknown }> = [];

    // Toujours exclure les supprimés (IS NULL)
    f.push({ column: 'deleted_at', operation: 'is', value: null });

    if (filters.type) f.push({ column: 'type', operation: 'eq', value: filters.type });
    if (filters.status) f.push({ column: 'status', operation: 'eq', value: filters.status });
    if (filters.plotId) f.push({ column: 'plot_id', operation: 'eq', value: filters.plotId });
    if (filters.campaignId) f.push({ column: 'campaign_id', operation: 'eq', value: filters.campaignId });
    if (filters.lotId) f.push({ column: 'lot_id', operation: 'eq', value: filters.lotId });
    if (filters.animalId) f.push({ column: 'animal_id', operation: 'eq', value: filters.animalId });
    if (filters.projectId) f.push({ column: 'project_id', operation: 'eq', value: filters.projectId });

    return f;
  }, [filters]);

  return usePaginatedQuery<SurveillanceEvent>({
    table: 'surveillance_events',
    columns: `
      *,
      plot:plots(id, reference, name),
      campaign:campaigns(id, year, crop_name),
      lot:animal_lots(id, identifier, species),
      animal:animals(id, identifier, species),
      project:projects(id, name),
      responsible:app_users(id, name)
    `,
    filters: queryFilters,
    orderBy: { column: 'scheduled_at', ascending: false },
    page,
    pageSize,
  });
}

/**
 * Données pour création / mise à jour d'un événement.
 */
export interface SurveillanceEventInput {
  type: SurveillanceEventType;
  farm_id: string;
  plot_id?: string | null;
  campaign_id?: string | null;
  lot_id?: string | null;
  animal_id?: string | null;
  project_id?: string | null;
  label: string;
  description?: string | null;
  scheduled_at: string; // ISO string
  completed_at?: string | null;
  status?: SurveillanceEventStatus;
  cost_amount?: number | null;
  responsible_id?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Hook pour les mutations (créer, modifier, marquer terminé, supprimer logiquement).
 * Utilise useAsyncAction pour toasts et état de chargement.
 */
export function useSurveillanceMutations() {
  const toast = useToast();
  const { loading, executeAction } = useAsyncAction();

  const create = async (input: SurveillanceEventInput): Promise<SurveillanceEvent | null> => {
    const result = await executeAction(async () => {
      const { data, error } = await supabase
        .from('surveillance_events')
        .insert([{
          farm_id: input.farm_id,
          type: input.type,
          plot_id: input.plot_id ?? null,
          campaign_id: input.campaign_id ?? null,
          lot_id: input.lot_id ?? null,
          animal_id: input.animal_id ?? null,
          project_id: input.project_id ?? null,
          label: input.label,
          description: input.description ?? null,
          scheduled_at: input.scheduled_at,
          completed_at: input.completed_at ?? null,
          status: input.status ?? 'planifie',
          cost_amount: input.cost_amount ?? null,
          responsible_id: input.responsible_id ?? null,
          details: input.details ?? {},
        }])
        .select('*')
        .single();

      if (error) throw error;
      return data as SurveillanceEvent;
    }, {
      successMessage: 'Événement créé',
      errorMessage: "Erreur lors de la création de l'événement",
    });
    return result ?? null;
  };

  const update = async (id: string, patch: Partial<SurveillanceEventInput>): Promise<SurveillanceEvent | null> => {
    const result = await executeAction(async () => {
      const { data, error } = await supabase
        .from('surveillance_events')
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data as SurveillanceEvent;
    }, {
      successMessage: 'Événement mis à jour',
      errorMessage: "Erreur lors de la mise à jour de l'événement",
    });
    return result ?? null;
  };

  const markCompleted = async (id: string): Promise<SurveillanceEvent | null> => {
    return update(id, {
      status: 'termine',
      completed_at: new Date().toISOString(),
    });
  };

  const softDelete = async (id: string): Promise<boolean> => {
    const result = await executeAction(async () => {
      const { error } = await supabase
        .from('surveillance_events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    }, {
      successMessage: 'Événement supprimé',
      errorMessage: "Erreur lors de la suppression de l'événement",
    });
    return result ?? false;
  };

  return {
    loading,
    create,
    update,
    markCompleted,
    softDelete,
  };
}

/**
 * Helper : détermine si un événement est "en retard" (calculé, pas stocké).
 */
export function isOverdue(event: SurveillanceEvent): boolean {
  if (event.status !== 'planifie') return false;
  return new Date(event.scheduled_at) < new Date();
}

/**
 * Helper : label lisible pour le type.
 */
export function getTypeLabel(type: SurveillanceEventType): string {
  switch (type) {
    case 'phyto_traitement': return 'Traitement phytosanitaire';
    case 'equip_panne': return 'Panne équipement';
  }
}

/**
 * Helper : label lisible pour le statut.
 */
export function getStatusLabel(status: SurveillanceEventStatus): string {
  switch (status) {
    case 'planifie': return 'Planifié';
    case 'en_cours': return 'En cours';
    case 'termine': return 'Terminé';
    case 'annule': return 'Annulé';
  }
}

/**
 * Helper : couleur badge pour le statut.
 */
export function getStatusColor(status: SurveillanceEventStatus): string {
  switch (status) {
    case 'planifie': return 'bg-blue-100 text-blue-700';
    case 'en_cours': return 'bg-amber-100 text-amber-700';
    case 'termine': return 'bg-green-100 text-green-700';
    case 'annule': return 'bg-slate-100 text-slate-700';
  }
}

/**
 * Helper : couleur badge pour le type.
 */
export function getTypeColor(type: SurveillanceEventType): string {
  switch (type) {
    case 'phyto_traitement': return 'bg-green-100 text-green-700';
    case 'equip_panne': return 'bg-red-100 text-red-700';
  }
}
