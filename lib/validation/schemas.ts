import { z } from 'zod';

// Schéma pour les utilisateurs
export const userSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  role: z.enum(['admin', 'manager', 'worker', 'accountant']),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Schéma pour les exploitations agricoles
export const farmSchema = z.object({
  name: z.string().min(2, 'Le nom de l exploitation doit contenir au moins 2 caractères'),
  location: z.string().optional(),
  size: z.number().min(0, 'La taille doit être positive').optional(),
  currency: z.string().default('XOF'),
  timezone: z.string().default('Africa/Abidjan'),
});

// Schéma pour les financements
export const fundingSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  date_sent: z.date().coerce(),
  date_expected: z.date().coerce().optional(),
  funder_id: z.string().uuid('ID du financeur invalide'),
  description: z.string().max(500).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'received']).default('pending'),
});

// Schéma pour les dépenses
export const expenseSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  date: z.date().coerce(),
  description: z.string().max(500),
  supplier_id: z.string().uuid('ID du fournisseur invalide').optional(),
  funder_id: z.string().uuid('ID du financeur invalide').optional(),
  expense_category: z.string().min(2, 'Catégorie requise'),
  receipt_url: z.string().url('URL invalide').optional(),
  is_validated: z.boolean().default(false),
});

// Schéma pour les parcelles agricoles
export const plotSchema = z.object({
  name: z.string().min(2, 'Le nom de la parcelle doit contenir au moins 2 caractères'),
  size: z.number().positive('La taille doit être positive'),
  location: z.string().optional(),
  soil_type: z.enum([
    'sandy',
    'loamy',
    'clay',
    'silty',
    'peaty',
    'chalky'
  ]).optional(),
  crop_type: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Schéma pour les campagnes culturales
export const campaignSchema = z.object({
  name: z.string().min(2, 'Le nom de la campagne doit contenir au moins 2 caractères'),
  year: z.number().int().min(1900).max(2100),
  plot_id: z.string().uuid('ID de parcelle invalide'),
  crop_type: z.string().min(2, 'Type de culture requis'),
  planted_date: z.date().coerce(),
  expected_harvest_date: z.date().coerce().optional(),
  actual_harvest_date: z.date().coerce().optional(),
  expected_yield: z.number().min(0).optional(),
  actual_yield: z.number().min(0).optional(),
  unit: z.string().default('kg'),
  status: z.enum([
    'planned',
    'planted',
    'growing',
    'harvested',
    'completed'
  ]).default('planned'),
});

// Schéma pour les animaux
export const animalSchema = z.object({
  identifier: z.string().min(2, 'L identificateur doit contenir au moins 2 caractères'),
  name: z.string().optional(),
  species: z.enum(['cattle', 'sheep', 'goat', 'poultry', 'swine']).optional(),
  breed: z.string().optional(),
  date_of_birth: z.date().coerce().optional(),
  gender: z.enum(['male', 'female']).optional(),
  weight: z.number().min(0).optional(),
  status: z.enum([
    'healthy',
    'sick',
    'recovering',
    'quarantined',
    'sold',
    'deceased'
  ]).default('healthy'),
  location: z.string().optional(),
  mother_id: z.string().uuid().optional(),
  father_id: z.string().uuid().optional(),
});

// Schéma pour les lots d'animaux
export const animalLotSchema = z.object({
  name: z.string().min(2, 'Le nom du lot doit contenir au moins 2 caractères'),
  animal_type: z.enum(['cattle', 'sheep', 'goat', 'poultry', 'swine']),
  quantity: z.number().int().positive('La quantité doit être positive'),
  acquired_date: z.date().coerce(),
  average_weight: z.number().min(0).optional(),
  location: z.string().optional(),
  status: z.enum([
    'active',
    'sold',
    'transferred',
    'deceased'
  ]).default('active'),
});

// Schéma pour les opérations culturales
export const operationSchema = z.object({
  plot_id: z.string().uuid('ID de parcelle invalide'),
  operation_type: z.enum([
    'plowing',
    'planting',
    'weeding',
    'fertilizing',
    'irrigation',
    'pesticide_application',
    'harvesting',
    'other'
  ]),
  date: z.date().coerce(),
  description: z.string().max(500).optional(),
  inputs_used: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().positive(),
      unit: z.string(),
      cost: z.number().min(0),
    })
  ).optional(),
  labor_hours: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
});

// Schéma pour les récoltes
export const harvestSchema = z.object({
  plot_id: z.string().uuid('ID de parcelle invalide'),
  crop_type: z.string().min(2, 'Type de culture requis'),
  quantity: z.number().positive('La quantité doit être positive'),
  unit: z.string().default('kg'),
  harvested_date: z.date().coerce(),
  moisture_content: z.number().min(0).max(100).optional(),
  quality_grade: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  buyer_id: z.string().uuid().optional(),
  sale_price: z.number().min(0).optional(),
  sale_date: z.date().coerce().optional(),
});

// Schéma pour les projets
export const projectSchema = z.object({
  name: z.string().min(2, 'Le nom du projet doit contenir au moins 2 caractères'),
  description: z.string().max(1000).optional(),
  start_date: z.date().coerce(),
  end_date: z.date().coerce().optional(),
  budget_allocated: z.number().min(0).optional(),
  budget_spent: z.number().min(0).default(0),
  status: z.enum([
    'planning',
    'ongoing',
    'completed',
    'cancelled',
    'on_hold'
  ]).default('planning'),
  manager_id: z.string().uuid('ID du gestionnaire invalide').optional(),
});

// Schéma pour les articles d'inventaire
export const inventoryItemSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().max(500).optional(),
  sku: z.string().optional(),
  unit: z.string().min(1, 'Unité requise').default('pcs'),
  category: z.string().optional(),
  min_stock_level: z.number().int().min(0).default(0),
  max_stock_level: z.number().int().min(0).optional(),
  current_stock: z.number().int().min(0).default(0),
  location: z.string().optional(),
  supplier_id: z.string().uuid().optional(),
  cost_per_unit: z.number().min(0).optional(),
});

// Schéma pour les mouvements d'inventaire
export const inventoryMovementSchema = z.object({
  item_id: z.string().uuid('ID d article invalide'),
  type: z.enum(['in', 'out', 'transfer', 'adjustment']),
  quantity: z.number().int().nonzero('La quantité ne peut pas être zéro'),
  date: z.date().coerce(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  from_location: z.string().optional(),
  to_location: z.string().optional(),
  cost_per_unit: z.number().min(0).optional(),
  total_cost: z.number().min(0).optional(),
});

// Schéma pour les alertes
export const alertSchema = z.object({
  title: z.string().min(2, 'Le titre doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  alert_type: z.enum([
    'disease',
    'pest',
    'weather',
    'market',
    'operational',
    'financial',
    'other'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  start_date: z.date().coerce(),
  end_date: z.date().coerce().optional(),
  is_active: z.boolean().default(true),
  notified: z.boolean().default(false),
});

// Export tous les schémas pour faciliter l'import
export {
  userSchema,
  farmSchema,
  fundingSchema,
  expenseSchema,
  plotSchema,
  campaignSchema,
  animalSchema,
  animalLotSchema,
  operationSchema,
  harvestSchema,
  projectSchema,
  inventoryItemSchema,
  inventoryMovementSchema,
  alertSchema,
};