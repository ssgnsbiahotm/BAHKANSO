import { supabase } from './supabase';

export async function calculateYield(
  campaignId: string,
  client = supabase
): Promise<number | null> {
  // 1. Surface de la parcelle via la campagne + 2. quantités récoltées (en parallèle)
  const [campaignRes, eventsRes] = await Promise.all([
    client
      .from('campaigns')
      .select('plot_id, plots(area_hectares)')
      .eq('id', campaignId)
      .single(),
    client
      .from('event_journal')
      .select('quantity')
      .eq('entity_type', 'harvest')
      .eq('event_type', 'recolte')
      .eq('context->>campaign_id', campaignId),
  ]);

  const campError = campaignRes.error;
  if (campError || !campaignRes.data) return null;
  const eventError = eventsRes.error;
  if (eventError) return null;
  const campaign = campaignRes.data;
  const events = eventsRes.data ?? [];

  const surface = (campaign as { plots?: { area_hectares: number }[] | null }).plots?.[0]?.area_hectares;
  if (!surface || surface <= 0) return null;

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
  // Nombre total et nombre d'étapes terminées (en parallèle)
  const [totalRes, doneRes] = await Promise.all([
    client.from('project_steps').select('id').eq('project_id', projectId),
    client
      .from('project_steps')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'terminé'),
  ]);

  if (totalRes.error) return null;
  const totalSteps = totalRes.data.length;
  if (totalSteps === 0) return 0;

  if (doneRes.error) return null;
  const doneSteps = doneRes.data.length;

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

  const [recettesRes, depensesRes] = await Promise.all([
    buildQuery('recette'),
    buildQuery('depense'),
  ]);

  const recettesError = recettesRes.error;
  const depensesError = depensesRes.error;
  if (recettesError || depensesError) return 0;

  const recettes = recettesRes?.data?.reduce(
    (sum: number, e) => sum + Number(e.amount || 0),
    0
  );
  const depenses = depensesRes?.data?.reduce(
    (sum: number, e) => sum + Number(e.amount || 0),
    0
  );

  return recettes - depenses;
}

export async function calculateCostPerUnit(
  farmId: string,
  campaignId?: string,
  client = supabase
): Promise<number | null> {
  // 1. Dépenses et 2. récoltes (en parallèle)
  const [depensesRes, recoltesRes] = await Promise.all([
    client
      .from('event_journal')
      .select('amount, context')
      .eq('farm_id', farmId)
      .eq('event_type', 'depense'),
    client
      .from('event_journal')
      .select('quantity, context')
      .eq('farm_id', farmId)
      .eq('event_type', 'recolte'),
  ]);

  const depenses = depensesRes.data ?? [];
  const totalDepenses = depenses.reduce((sum, e) => {
    const ctxCampaign = (e.context as { campaign_id?: string })?.campaign_id;
    if (campaignId && ctxCampaign !== campaignId) return sum;
    return sum + Number(e.amount || 0);
  }, 0);

  const recoltes = recoltesRes.data ?? [];

  const totalQuantity = recoltes?.reduce((sum, e) => {
    const ctxCampaign = (e.context as { campaign_id?: string })?.campaign_id;
    if (campaignId && ctxCampaign !== campaignId) return sum;
    return sum + Number(e.quantity || 0);
  }, 0);

  if (!totalDepenses || !totalQuantity || totalQuantity <= 0) return null;

  return totalDepenses / totalQuantity;
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
    (e) => e.event_type === 'animal_ne' || e.event_type === 'animal_mort'
  );
  const births = relevant.filter((e) => e.event_type === 'animal_ne').length;
  const deaths = relevant.filter((e) => e.event_type === 'animal_mort').length;
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
  // 1. Recettes et 2. dépenses de la campagne (en parallèle)
  const [harvestsRes, cropOpsRes] = await Promise.all([
    client.from('harvests').select('revenue').eq('campaign_id', campaignId),
    client.from('crop_operations').select('cost, labor_cost').eq('campaign_id', campaignId),
  ]);

  const harvestsError = harvestsRes.error;
  if (harvestsError) return 0;
  const harvests = harvestsRes.data ?? [];

  const totalRecettes = harvests.reduce(
    (sum, h) => sum + Number(h.revenue || 0),
    0
  );

  const opsError = cropOpsRes.error;
  if (opsError) return 0;
  const cropOps = cropOpsRes.data ?? [];

  const totalDepenses = cropOps?.reduce(
    (sum, op) => sum + Number(op.cost || 0) + Number(op.labor_cost || 0),
    0
  );

  return totalRecettes - totalDepenses;
}
