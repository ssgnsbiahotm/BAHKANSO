import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import type {
  Farm, AppUser, Funder, Funding, BankAccount, CashAccount, Transaction,
  Supplier, Expense, Document, Site, Plot, Campaign, CropOperation, Harvest,
  Animal, AnimalLot, AnimalEvent, Project, ProjectStep, InventoryItem,
  InventoryMovement, InventoryCount, Budget, Alert, Notification, AuditLog,
  SiteContent, Recipe,
} from './types';

interface DataContextType {
  farm: Farm | null;
  users: AppUser[];
  funders: Funder[];
  fundings: Funding[];
  bankAccounts: BankAccount[];
  cashAccounts: CashAccount[];
  transactions: Transaction[];
  suppliers: Supplier[];
  expenses: Expense[];
  documents: Document[];
  sites: Site[];
  plots: Plot[];
  campaigns: Campaign[];
  cropOperations: CropOperation[];
  harvests: Harvest[];
  animals: Animal[];
  animalLots: AnimalLot[];
  animalEvents: AnimalEvent[];
  projects: Project[];
  projectSteps: ProjectStep[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  inventoryCounts: InventoryCount[];
  budgets: Budget[];
  alerts: Alert[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  siteContent: Record<string, SiteContent>;
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { authUser } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [funders, setFunders] = useState<Funder[]>([]);
  const [fundings, setFundings] = useState<Funding[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [cropOperations, setCropOperations] = useState<CropOperation[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [animalLots, setAnimalLots] = useState<AnimalLot[]>([]);
  const [animalEvents, setAnimalEvents] = useState<AnimalEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectSteps, setProjectSteps] = useState<ProjectStep[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [inventoryCounts, setInventoryCounts] = useState<InventoryCount[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [siteContent, setSiteContent] = useState<Record<string, SiteContent>>({});
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        farmRes, usersRes, fundersRes, fundingsRes, bankRes, cashRes,
        txnRes, suppliersRes, expensesRes, docsRes, sitesRes, plotsRes,
        campaignsRes, cropOpsRes, harvestsRes, animalsRes, lotsRes,
        animalEventsRes, projectsRes, stepsRes, invItemsRes, invMovRes,
        invCountsRes, budgetsRes, alertsRes, notifRes, auditRes, siteContentRes,
        recipesRes,
      ] = await Promise.all([
        supabase.from('farms').select('*').limit(1).maybeSingle(),
        supabase.from('app_users').select('*').order('name'),
        supabase.from('funders').select('*').order('name'),
        supabase.from('fundings').select('*, funder:funders(*)').order('date_sent', { ascending: false }),
        supabase.from('bank_accounts').select('*').order('name'),
        supabase.from('cash_accounts').select('*').order('name'),
        supabase.from('transactions').select('*').order('transaction_date', { ascending: false }),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('expenses').select('*, supplier:suppliers(*), funder:funders(*)').order('date', { ascending: false }),
        supabase.from('documents').select('*').order('upload_date', { ascending: false }),
        supabase.from('sites').select('*').order('name'),
        supabase.from('plots').select('*').order('name'),
        supabase.from('campaigns').select('*, plot:plots(*)').order('year', { ascending: false }),
        supabase.from('crop_operations').select('*').order('date', { ascending: false }),
        supabase.from('harvests').select('*').order('date', { ascending: false }),
        supabase.from('animals').select('*').order('identifier'),
        supabase.from('animal_lots').select('*').order('identifier'),
        supabase.from('animal_events').select('*').order('date', { ascending: false }),
        supabase.from('projects').select('*').order('name'),
        supabase.from('project_steps').select('*').order('name'),
        supabase.from('inventory_items').select('*').order('name'),
        supabase.from('inventory_movements').select('*, item:inventory_items(*)').order('date', { ascending: false }),
        supabase.from('inventory_counts').select('*, item:inventory_items(*)').order('count_date', { ascending: false }),
        supabase.from('budgets').select('*').order('object_name'),
        supabase.from('alerts').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('site_content').select('*'),
        supabase.from('recipes').select('*').order('created_at', { ascending: false }),
      ]);

      if (farmRes.error) throw farmRes.error;
      setFarm(farmRes.data);
      if (usersRes.error) throw usersRes.error;
      setUsers(usersRes.data || []);
      setFunders(fundersRes.data || []);
      setFundings(fundingsRes.data || []);
      setBankAccounts(bankRes.data || []);
      setCashAccounts(cashRes.data || []);
      setTransactions(txnRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setExpenses(expensesRes.data || []);
      setDocuments(docsRes.data || []);
      setSites(sitesRes.data || []);
      setPlots(plotsRes.data || []);
      setCampaigns(campaignsRes.data || []);
      setCropOperations(cropOpsRes.data || []);
      setHarvests(harvestsRes.data || []);
      setAnimals(animalsRes.data || []);
      setAnimalLots(lotsRes.data || []);
      setAnimalEvents(animalEventsRes.data || []);
      setProjects(projectsRes.data || []);
      setProjectSteps(stepsRes.data || []);
      setInventoryItems(invItemsRes.data || []);
      setInventoryMovements(invMovRes.data || []);
      setInventoryCounts(invCountsRes.data || []);
      setBudgets(budgetsRes.data || []);
      setAlerts(alertsRes.data || []);
      setNotifications(notifRes.data || []);
      setAuditLogs(auditRes.data || []);
      const contentMap: Record<string, SiteContent> = {};
      for (const row of (siteContentRes.data || [])) {
        contentMap[row.key] = row as SiteContent;
      }
      setSiteContent(contentMap);
      setRecipes((recipesRes.data as Recipe[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      loadAll();
    } else {
      setLoading(false);
    }
  }, [authUser, loadAll]);

  return (
    <DataContext.Provider value={{
      farm, users, funders, fundings, bankAccounts, cashAccounts, transactions,
      suppliers, expenses, documents, sites, plots, campaigns, cropOperations,
      harvests, animals, animalLots, animalEvents, projects, projectSteps,
      inventoryItems, inventoryMovements, inventoryCounts, budgets, alerts,
      notifications, auditLogs, siteContent, recipes, loading, error, refresh: loadAll,
    }}>
      {children}
    </DataContext.Provider>
  );
}
