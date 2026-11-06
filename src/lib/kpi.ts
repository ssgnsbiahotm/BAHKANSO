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
