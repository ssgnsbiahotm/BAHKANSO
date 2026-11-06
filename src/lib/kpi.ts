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

export async function calculateGrossMargin(
  farmId: string,
  startDate?: string,
  endDate?: string,
  client = supabase
): Promise<number> {
  const buildQuery = (eventType: string) => {
    let q = client
      .from('event_journal')
      .select('amount')
      .eq('farm_id', farmId)
      .eq('event_type', eventType);
    if (startDate) q = q.gte('occurred_at', startDate);
    if (endDate) q = q.lte('occurred_at', endDate);
    return q;
  };

  const { data: recettesRows, error: recettesError } = await buildQuery(
    'recette'
  );
  const { data: depensesRows, error: depensesError } = await buildQuery(
    'depense'
  );

  if (recettesError || depensesError) return 0;

  const recettes = recettesRows?.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );
  const depenses = depensesRows?.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  return recettes - depenses;
}

export async function calculateCostPerUnit(
  farmId: string,
  campaignId?: string,
  client = supabase
): Promise<number | null> {
  // 1. Dépenses
  const { data: depenses } = await client
    .from('event_journal')
    .select('amount, context')
    .eq('farm_id', farmId)
    .eq('event_type', 'depense');

  const totalDepenses = depenses?.reduce((sum, e) => {
    const ctxCampaign = (e.context as { campaign_id?: string })?.campaign_id;
    if (campaignId && ctxCampaign !== campaignId) return sum;
    return sum + Number(e.amount || 0);
  }, 0);

  // 2. Quantité produite (récoltes)
  const { data: recoltes } = await client
    .from('event_journal')
    .select('quantity, context')
    .eq('farm_id', farmId)
    .eq('event_type', 'recolte');

  const totalQuantity = recoltes?.reduce((sum, e) => {
    const ctxCampaign = (e.context as { campaign_id?: string })?.campaign_id;
    if (campaignId && ctxCampaign !== campaignId) return sum;
    return sum + Number(e.quantity || 0);
  }, 0);

  if (!totalQuantity || totalQuantity <= 0) return null;

  return totalDepenses! / totalQuantity;
}
