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
  site_id: string | null;
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
  active?: boolean;
  created_at?: string;
  user_id?: string | null;
}

export interface Funding {
  id: string;
  reference: string | null;
  label: string | null;
  source_type: string | null;
  amount: number;
  currency: string;
  funding_date: string | null;
  expected_date: string | null;
  status: string;
  description: string | null;
  justificatif_url: string | null;
  justificatif_file_name: string | null;
  justificatif_uploaded_at: string | null;
  project_id: string | null;
  funder_id: string | null;
  amount_sent: number;
  currency_sent: string;
  exchange_rate: number | null;
  amount_received: number | null;
  transfer_fees: number | null;
  date_sent: string | null;
  date_received: string | null;
  destination_account_id: string | null;
  bank_reference: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
  funder?: Funder | null;
  site_id: string | null;
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
  site_id: string | null;
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
  label: string | null;
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
  site_id: string | null;
  activity: string | null;
  funding_id: string | null;
  description: string | null;
  status: string;
  has_justificatif: boolean;
  justificatif_url: string | null;
  justificatif_file_name: string | null;
  justificatif_uploaded_at: string | null;
  amount_paid: number;
  date_paid: string | null;
  payment_method_detail: string | null;
  payment_reference: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier | null;
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
  site_id: string | null;
}

export interface Site {
  id: string;
  name: string;
  location: string | null;
  area_hectares: number | null;
  responsible: string | null;
  farm_id: string | null;
  code: string | null;
  status: string | null;
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
  site_id: string | null;
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
  name: string | null;
  species: string;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  date_of_birth: string | null;
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
  site_id: string | null;
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
  site_id: string | null;
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

export type SurveillanceEventType = 'phyto_traitement' | 'equip_panne';
export type SurveillanceEventStatus = 'planifie' | 'en_cours' | 'termine' | 'annule';

export interface SurveillanceEvent {
  id: string;
  farm_id: string;
  type: SurveillanceEventType;
  plot_id: string | null;
  campaign_id: string | null;
  lot_id: string | null;
  animal_id: string | null;
  project_id: string | null;
  label: string;
  description: string | null;
  scheduled_at: string;
  completed_at: string | null;
  status: SurveillanceEventStatus;
  cost_amount: number | null;
  responsible_id: string | null;
  details: Record<string, unknown>;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations (optionnelles, pour affichage)
  plot?: { id: string; reference: string | null; name: string } | null;
  campaign?: { id: string; year: number; crop_name: string } | null;
  lot?: { id: string; identifier: string; species: string } | null;
  animal?: { id: string; identifier: string | null; species: string } | null;
  project?: { id: string; name: string } | null;
  responsible?: { id: string; name: string } | null;
}

export interface SiteContent {
  id: string;
  key: string;
  value: Record<string, unknown> | unknown[];
  updated_at: string;
}

export interface Media {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: string; // 'image' | 'icon' | 'logo'
  category: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FundingAllocation {
  id: string;
  funding_id: string;
  site_id: string;
  amount_fcfa: number;
  created_at: string;
}

export interface Customer {
  id: string;
  site_id: string | null;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  total_purchases: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  reference: string | null;
  site_id: string | null;
  customer_id: string | null;
  date: string;
  payment_method: string;
  bank_account_id: string | null;
  cash_account_id: string | null;
  total_amount: number;
  status: string;
  comment: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  source_type: string; // 'harvest' | 'animal' | 'animal_lot' | 'inventory_item'
  source_id: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  created_at: string;
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
