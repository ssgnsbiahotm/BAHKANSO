import type {
  Alert,
  Animal,
  AnimalEvent,
  Budget,
  Campaign,
  Expense,
  InventoryItem,
  Project,
} from '@/lib/types';

export interface CandidateAlert {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  object_type: string;
  object_id: string;
  object_name?: string;
}

const ANIMAL_NO_EVENT_DAYS = 30;

/**
 * Indique si une alerte ouverte existe déjà pour ce couple (object_type, object_id).
 * Reprend le pattern de déduplication déjà utilisé dans AlertesTab.
 */
function isAlreadyAlerted(
  openAlerts: Alert[],
  object_type: string,
  object_id: string,
): boolean {
  return openAlerts.some(
    (a) =>
      a.status === 'ouverte' &&
      a.object_type === object_type &&
      a.object_id === object_id,
  );
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

/**
 * Évalue les règles métier inter-modules et retourne les candidatures d'alerte
 * à créer. Les suggestions sont dérivées en mémoire, sans écriture base ni
 * nouvelle table (conformément à la décision d'architecture).
 */
export function evaluateAlertRules({
  animals,
  animalEvents,
  campaigns,
  inventoryItems,
  budgets,
  expenses,
  projects,
  openAlerts,
}: {
  animals?: Animal[];
  animalEvents?: AnimalEvent[];
  campaigns?: Campaign[];
  inventoryItems?: InventoryItem[];
  budgets?: Budget[];
  expenses?: Expense[];
  projects?: Project[];
  openAlerts: Alert[];
}): CandidateAlert[] {
  const candidates: CandidateAlert[] = [];
  const today = todayStr();
  const animalNoEventSince = daysAgoStr(ANIMAL_NO_EVENT_DAYS);

  // Index des événements récents par animal (dernière date d'événement)
  const lastEventByAnimal = new Map<string, string>();
  if (animalEvents) {
    for (const ev of animalEvents) {
      if (!ev.animal_id) continue;
      const prev = lastEventByAnimal.get(ev.animal_id);
      if (!prev || ev.date > prev) lastEventByAnimal.set(ev.animal_id, ev.date);
    }
  }

  // Règle 1 : Stock critique (current_stock <= min_stock)
  if (inventoryItems) {
    for (const item of inventoryItems) {
      if (Number(item.current_stock) <= Number(item.min_stock)) {
        if (isAlreadyAlerted(openAlerts, 'inventory_item', item.id)) continue;
        candidates.push({
          title: `Stock critique : ${item.name}`,
          description: `L'article ${item.name} est à ${item.current_stock} ${item.unit}, sous le seuil minimum de ${item.min_stock}.`,
          severity: 'high',
          category: 'Stocks',
          object_type: 'inventory_item',
          object_id: item.id,
          object_name: item.name,
        });
      }
    }
  }

  // Règle 2 : Justificatif manquant (has_justificatif = false ET status != brouillon)
  if (expenses) {
    for (const exp of expenses) {
      if (exp.has_justificatif === false && exp.status !== 'brouillon') {
        if (isAlreadyAlerted(openAlerts, 'expense', exp.id)) continue;
        candidates.push({
          title: `Justificatif manquant : ${exp.reference || exp.id}`,
          description: `La dépense ${exp.reference || exp.id} (${exp.label || ''}) manque de justificatif attaché.`,
          severity: 'medium',
          category: 'Justificatifs',
          object_type: 'expense',
          object_id: exp.id,
          object_name: exp.label ?? exp.reference ?? undefined,
        });
      }
    }
  }

  // Règle 3 : Projet en retard (expected_end_date < today ET status != terminé)
  if (projects) {
    for (const proj of projects) {
      if (
        proj.expected_end_date &&
        proj.expected_end_date < today &&
        proj.status !== 'terminé'
      ) {
        if (isAlreadyAlerted(openAlerts, 'project', proj.id)) continue;
        candidates.push({
          title: `Projet en retard : ${proj.name}`,
          description: `Le projet ${proj.name} est en retard (date de fin prévue : ${proj.expected_end_date}).`,
          severity: 'high',
          category: 'Chantiers',
          object_type: 'project',
          object_id: proj.id,
          object_name: proj.name,
        });
      }
    }
  }

  // Règle 4 : Dépense dépasse budget (paid_amount > initial_budget)
  if (budgets) {
    for (const bud of budgets) {
      const budget = bud.revised_budget || bud.initial_budget;
      if (bud.paid_amount > budget) {
        if (isAlreadyAlerted(openAlerts, 'budget', bud.id)) continue;
        candidates.push({
          title: `Dépense dépasse le budget : ${bud.object_name}`,
          description: `Le budget "${bud.object_name}" est dépassé : ${bud.paid_amount.toFixed(0)} FCFA engagés sur ${budget.toFixed(0)} FCFA prévus.`,
          severity: 'high',
          category: 'Finance',
          object_type: 'budget',
          object_id: bud.id,
          object_name: bud.object_name,
        });
      }
    }
  }

  // Règle 5 : Animal sans événement depuis 30 jours
  if (animals) {
    for (const animal of animals) {
      if (animal.status !== 'actif') continue;
      const lastEvent = lastEventByAnimal.get(animal.id);
      if (lastEvent && lastEvent >= animalNoEventSince) continue;
      if (isAlreadyAlerted(openAlerts, 'animal', animal.id)) continue;
      candidates.push({
        title: `Animal sans événement : ${animal.identifier || animal.name || animal.id}`,
        description: `L'animal ${animal.identifier || animal.name || animal.id} n'a aucun événement enregistré depuis plus de ${ANIMAL_NO_EVENT_DAYS} jours.`,
        severity: 'medium',
        category: 'Élevage',
        object_type: 'animal',
        object_id: animal.id,
        object_name: animal.identifier ?? animal.name ?? undefined,
      });
    }
  }

  // Règle 6 : Récolte en retard (expected_harvest_date < today ET status != récolté)
  if (campaigns) {
    for (const camp of campaigns) {
      if (
        camp.expected_harvest_date &&
        camp.expected_harvest_date < today &&
        camp.status !== 'récolté'
      ) {
        if (isAlreadyAlerted(openAlerts, 'campaign', camp.id)) continue;
        candidates.push({
          title: `Récolte en retard : ${camp.crop_name}`,
          description: `La campagne ${camp.crop_name} (${camp.year}) devait être récoltée le ${camp.expected_harvest_date}.`,
          severity: 'high',
          category: 'Agriculture',
          object_type: 'campaign',
          object_id: camp.id,
          object_name: camp.crop_name,
        });
      }
    }
  }

  return candidates;
}

export { ANIMAL_NO_EVENT_DAYS };
