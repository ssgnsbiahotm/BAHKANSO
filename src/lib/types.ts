import { supabase } from './supabase';

export interface Farm {
  id: string;
  name: string;
  location: string | null;
  country: string | null;
  currency: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

export interface AppUser {
  id: string;
  auth_id: string | null;
  name: string;
  email: string | null;
  role: string;
  phone: string | null;
  active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface Funder {
  id: string;
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  total_sent: number;
  total_received: number;
}

export interface Funding {
  id: string;
  reference: string | null;
  funder_id: string | null;
  amount_sent: number;
  currency_sent: string;
  exchange_rate: number | null;
  amount_received: number | null;
  transfer_fees: number | null;
  date_sent: string;
  date_received: string | null;
  destination_account_id: string | null;
  bank_reference: string | null;
  status: string;
  project_id: string | null;
  comment: string | null;
  created_at: string;
  funder?: Funder | null;
}

export interface FundingSummary {
  id: string;
  reference: string | null;
  funder_id: string | null;
  amount_sent: number;
  currency_sent: string;
  exchange_rate: number | null;
  amount_received: number | null;
  transfer_fees: number | null;
  date_sent: string;
  date_received: string | null;
  bank_reference: string | null;
  status: string;
  comment: string | null;
  funder: Pick<Funder, 'name'> | null;
}

export interface BankAccount {
  id: string;
  name: string;
  bank_name: string | null;
  account_number: string | null;
  iban: string | null;
  currency: string;
  balance: number;
}

export interface CashAccount {
  id: string;
  name: string;
  location: string | null;
  currency: string;
  balance: number;
  responsible: string | null;
}

export interface Transaction {
  id: string;
  reference: string | null;
  type: string;
  amount: number;
  currency: string;
  bank_account_id: string | null;
  cash_account_id: string | null;
  direction: string;
  description: string | null;
  funding_id: string | null;
  transaction_date: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  total_purchases: number;
  rating: number;
}

export interface Expense {
  id: string;
  reference: string | null;
  date: string;
  amount: number;
  currency: string;
  category: string | null;
  supplier_id: string | null;
  responsible: string | null;
  payment_method: string;
  bank_account_id: string | null;
  cash_account_id: string | null;
  project_id: string | null;
  activity: string | null;
  funding_id: string | null;
  description: string | null;
  status: string;
  has_justificatif: boolean;
  comment: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier | null;
  funder?: Funder | null;
}

export interface Document {
  id: string;
  reference: string | null;
  type: string;
  name: string;
  file_url: string | null;
  file_hash: string | null;
  file_size: number | null;
  mime_type: string | null;
  upload_date: string;
  uploaded_by: string | null;
  object_type: string | null;
  object_id: string | null;
  status: string;
  verified_date: string | null;
  verified_by: string | null;
  comment: string | null;
}

export interface Site {
  id: string;
  name: string;
  location: string | null;
  area_hectares: number | null;
  responsible: string | null;
}

export interface Plot {
  id: string;
  reference: string | null;
  name: string;
  site_id: string | null;
  area_hectares: number;
  location: string | null;
  soil_type: string | null;
  status: string;
  current_crop: string | null;
}

export interface Campaign {
  id: string;
  year: number;
  plot_id: string | null;
  crop_name: string;
  start_date: string | null;
  expected_harvest_date: string | null;
  budget: number;
  responsible: string | null;
  status: string;
  plot?: Plot | null;
}

export interface CropOperation {
  id: string;
  campaign_id: string | null;
  plot_id: string | null;
  type: string;
  date: string;
  responsible: string | null;
  cost: number;
  labor_cost: number;
  inputs: string | null;
  quantity: number | null;
  unit: string | null;
  comment: string | null;
}

export interface Harvest {
  id: string;
  campaign_id: string | null;
  plot_id: string | null;
  date: string;
  quantity: number;
  unit: string;
  quality: string | null;
  estimated_price: number | null;
  revenue: number | null;
  destination: string | null;
}

export interface Animal {
  id: string;
  identifier: string | null;
  species: string;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  origin: string | null;
  acquisition_date: string | null;
  acquisition_value: number;
  weight_kg: number | null;
  lot_id: string | null;
  location: string | null;
  status: string;
  estimated_value: number;
}

export interface AnimalLot {
  id: string;
  identifier: string | null;
  species: string;
  breed: string | null;
  count: number;
  location: string | null;
  status: string;
  estimated_value: number;
}

export interface AnimalEvent {
  id: string;
  animal_id: string | null;
  lot_id: string | null;
  type: string;
  date: string;
  description: string | null;
  cost: number;
  responsible: string | null;
}

export interface Project {
  id: string;
  name: string;
  type: string | null;
  responsible: string | null;
  initial_budget: number;
  revised_budget: number;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  status: string;
  progress: number;
  description: string | null;
  funding_id: string | null;
}

export interface ProjectStep {
  id: string;
  project_id: string;
  name: string;
  budget: number;
  actual_cost: number;
  progress: number;
  responsible: string | null;
  date: string | null;
  status: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  min_stock: number;
  current_stock: number;
  location: string | null;
  unit_cost: number;
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  type: string;
  quantity: number;
  unit_cost: number;
  date: string;
  reason: string | null;
  linked_object_type: string | null;
  linked_object_id: string | null;
  responsible: string | null;
  item?: InventoryItem | null;
}

export interface InventoryCount {
  id: string;
  item_id: string;
  count_date: string;
  theoretical_stock: number;
  physical_stock: number;
  difference: number;
  justification: string | null;
  status: string;
  validated_by: string | null;
  item?: InventoryItem | null;
}

export interface Budget {
  id: string;
  object_type: string;
  object_id: string | null;
  object_name: string;
  initial_budget: number;
  revised_budget: number;
  committed_amount: number;
  paid_amount: number;
  period: string | null;
}

export interface Alert {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  object_type: string | null;
  object_id: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string | null;
  level: string;
  object_type: string | null;
  object_id: string | null;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_name: string | null;
  action: string;
  object_type: string | null;
  object_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  description: string | null;
  created_at: string;
}

export interface SiteContent {
  id: string;
  key: string;
  value: Record<string, unknown> | unknown[];
  updated_at: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: string;
  status: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function logAudit(
  user_name: string,
  action: string,
  object_type: string,
  object_id: string | null,
  description: string,
  old_value?: Record<string, unknown> | null,
  new_value?: Record<string, unknown> | null,
) {
  await supabase.from('audit_logs').insert({
    user_name,
    action,
    object_type,
    object_id,
    description,
    old_value: old_value || null,
    new_value: new_value || null,
  });
}
