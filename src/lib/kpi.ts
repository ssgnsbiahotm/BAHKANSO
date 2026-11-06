import { supabase } from './supabase';

export async function calculateYield(
  campaignId: string,
  client = supabase
): Promise<number | null> {
  // 1. Surface de la parcelle via la campagne
  const { data: campaign, error: campError } = await client
    .from('campaigns')
    .select('plot_id, plots(area_hectares)')
    .eq('id', campaignId)
    .single();

  if (campError || !campaign) return null;
  const surface = (campaign as any).plots?.area_hectares;
  if (!surface || surface <= 0) return null;

  // 2. Somme des quantités récoltées dans le journal pour cette campagne
  const { data: events, error: eventError } = await client
    .from('event_journal')
    .select('quantity')
    .eq('entity_type', 'harvest')
    .eq('event_type', 'recolte')
    .eq('context->>campaign_id', campaignId);

  if (eventError) return null;
  const totalQuantity = events.reduce(
    (sum, e) => sum + Number(e.quantity || 0),
    0
  );

  // 3. Rendement = quantité totale / surface (kg par hectare)
  return totalQuantity / surface;
}

export async function calculateProjectProgress(
  projectId: string,
  client = supabase
): Promise<number | null> {
  // Nombre total d'étapes du projet
  const { data: totalRows, error: totalError } = await client
    .from('project_steps')
    .select('id')
    .eq('project_id', projectId);

  if (totalError) return null;
  const totalSteps = totalRows.length;
  if (totalSteps === 0) return 0;

  // Nombre d'étapes terminées
  const { data: doneRows, error: doneError } = await client
    .from('project_steps')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'terminé');

  if (doneError) return null;
  const doneSteps = doneRows.length;

  return Math.round((doneSteps / totalSteps) * 100);
}
