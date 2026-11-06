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

export async function calculateMortalityRate(
  farmId: string,
  startDate?: string,
  endDate?: string,
  client = supabase
): Promise<number> {
  let q = client
    .from('event_journal')
    .select('event_type')
    .eq('farm_id', farmId);

  if (startDate) q = q.gte('occurred_at', startDate);
  if (endDate) q = q.lte('occurred_at', endDate);

  const { data, error } = await q;
  if (error || !data) return 0;

  const relevant = data.filter(
    (e) => e.event_type === 'naissance' || e.event_type === 'mort'
  );
  const births = relevant.filter((e) => e.event_type === 'naissance').length;
  const deaths = relevant.filter((e) => e.event_type === 'mort').length;
  const total = births + deaths;

  if (total === 0) return 0;
  return (deaths / total) * 100;
}

export async function calculateAverageDailyGain(
  farmId: string,
  animalId?: string,
  client = supabase
): Promise<number | null> {
  // 1. Récupérer les sites de la ferme
  const { data: sites, error: sitesError } = await client
    .from('sites')
    .select('id')
    .eq('farm_id', farmId);

  if (sitesError || !sites || sites.length === 0) return null;

  const siteIds = sites.map((s) => s.id);

  // 2. Récupérer les animaux de ces sites avec poids et date de naissance
  let q = client
    .from('animals')
    .select('id, weight_kg, birth_date')
    .in('site_id', siteIds);

  if (animalId) q = q.eq('id', animalId);

  const { data: animals, error: animalsError } = await q;
  if (animalsError || !animals) return null;

  const gains = animals
    .map((a) => {
      if (!a.weight_kg || !a.birth_date) return null;
      const birth = new Date(a.birth_date).getTime();
      const now = Date.now();
      const days = (now - birth) / (1000 * 60 * 60 * 24);
      if (days <= 0) return null;
      return Number(a.weight_kg) / days;
    })
    .filter((g): g is number => g !== null);

  if (gains.length === 0) return null;

  return gains.reduce((sum, g) => sum + g, 0) / gains.length;
}

export async function calculateCampaignMargin(
  campaignId: string,
  client = supabase
): Promise<number> {
  // 1. Recettes de la campagne (revenue des récoltes)
  const { data: harvests, error: harvestsError } = await client
    .from('harvests')
    .select('revenue')
    .eq('campaign_id', campaignId);

  if (harvestsError) return 0;

  const totalRecettes = harvests?.reduce(
    (sum, h) => sum + Number(h.revenue || 0),
    0
  );

  // 2. Dépenses de la campagne (opérations culturales)
  const { data: cropOps, error: opsError } = await client
    .from('crop_operations')
    .select('cost, labor_cost')
    .eq('campaign_id', campaignId);

  if (opsError) return 0;

  const totalDepenses = cropOps?.reduce(
    (sum, op) => sum + Number(op.cost || 0) + Number(op.labor_cost || 0),
    0
  );

  return totalRecettes - totalDepenses;
}
