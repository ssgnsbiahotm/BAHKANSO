/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useLayoutEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import { canReadFundings, createRequestEpoch } from './access';
import type {
  Farm, AppUser, Funder, FundingSummary, BankAccount, CashAccount, Transaction,
  Supplier, Expense, Document, Site, Plot, Campaign, CropOperation, Harvest,
  Animal, AnimalLot, AnimalEvent, Project, ProjectStep, InventoryItem,
  InventoryMovement, InventoryCount, Budget, Alert, Notification, AuditLog,
  SiteContent,
} from './types';

interface DataContextType {
  farm: Farm | null;
  users: AppUser[];
  funders: Funder[];
  fundings: FundingSummary[];
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
  const { accessState } = useAuth();
  const requestEpoch = useRef(createRequestEpoch());
  const mayReadFundings = canReadFundings(accessState);

  // State variables for all data types
  const [farm, setFarm] = useState<Farm | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [funders, setFunders] = useState<Funder[]>([]);
  const [fundings, setFundings] = useState<FundingSummary[]>([]);
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch functions for each data type
  const fetchFarm = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('farm')
      .select('*')
      .limit(1)
      .single();

    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw queryError;
    }

    return data ?? null;
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('app_users')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchFunders = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('funders')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchFundings = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('fundings')
      .select('id, reference, funder_id, amount_sent, currency_sent, exchange_rate, amount_received, transfer_fees, date_sent, date_received, bank_reference, status, comment, funder:funders(name)')
      .order('date_sent', { ascending: false });

    if (queryError) throw queryError;
    return (data ?? []).map(row => ({
      id: row.id,
      reference: row.reference,
      funder_id: row.funder_id,
      amount_sent: row.amount_sent,
      currency_sent: row.currency_sent,
      exchange_rate: row.exchange_rate,
      amount_received: row.amount_received,
      transfer_fees: row.transfer_fees,
      date_sent: row.date_sent,
      date_received: row.date_received,
      bank_reference: row.bank_reference,
      status: row.status,
      comment: row.comment,
      funder: Array.isArray(row.funder) ? row.funder[0] ?? null : row.funder ?? null,
    }));
  }, []);

  const fetchBankAccounts = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('bank_accounts')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchCashAccounts = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('cash_accounts')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchTransactions = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('suppliers')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchExpenses = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('expenses')
      .select('*, supplier:suppliers(name), funder:funders(name)')
      .order('date', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchDocuments = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('documents')
      .select('*')
      .order('upload_date', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchSites = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('sites')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchPlots = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('plots')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchCampaigns = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('campaigns')
      .select('*, plot:plots(name)')
      .order('year', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchCropOperations = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('crop_operations')
      .select('*, campaign:campaigns(name), plot:plots(name)')
      .order('date', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchHarvests = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('harvests')
      .select('*, campaign:campaigns(name), plot:plots(name)')
      .order('date', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchAnimals = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('animals')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchAnimalLots = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('animal_lots')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchAnimalEvents = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('animal_events')
      .select('*, animal:animals(identifier), lot:animal_lots(identifier)')
      .order('date', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchProjects = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('projects')
      .select('*, funder:funders(name)')
      .order('created_at', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchProjectSteps = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('project_steps')
      .select('*, project:projects(name)')
      .order('date', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchInventoryItems = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('inventory_items')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchInventoryMovements = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('inventory_movements')
      .select('*, item:inventory_items(name)')
      .order('date', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchInventoryCounts = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('inventory_counts')
      .select('*, item:inventory_items(name)')
      .order('count_date', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchBudgets = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('budgets')
      .select('*');

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchAlerts = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchNotifications = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (queryError) throw queryError;
    return data ?? [];
  }, []);

  const fetchSiteContent = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('site_content')
      .select('*');

    if (queryError) throw queryError;
    if (!data) return {};

    // Convert array to object keyed by 'key' field
    const result: Record<string, SiteContent> = {};
    data.forEach(item => {
      if (item.key) {
        result[item.key] = item;
      }
    });
    return result;
  }, []);

  // Combined fetch function that loads all data with proper loading state
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Always load fundings first as it controls access to private data
      const fundingsData = await fetchFundings();
      setFundings(fundingsData);

      // Load data that should be available when user can read fundings (private business data)
      if (mayReadFundings) {
        await Promise.all([
          fetchFarm().then(setFarm).catch(err => { throw err; }),
          fetchUsers().then(setUsers).catch(err => { throw err; }),
          fetchFunders().then(setFunders).catch(err => { throw err; }),
          fetchBankAccounts().then(setBankAccounts).catch(err => { throw err; }),
          fetchCashAccounts().then(setCashAccounts).catch(err => { throw err; }),
          fetchTransactions().then(setTransactions).catch(err => { throw err; }),
          fetchSuppliers().then(setSuppliers).catch(err => { throw err; }),
          fetchExpenses().then(setExpenses).catch(err => { throw err; }),
          fetchDocuments().then(setDocuments).catch(err => { throw err; }),
          fetchSites().then(setSites).catch(err => { throw err; }),
          fetchPlots().then(setPlots).catch(err => { throw err; }),
          fetchCampaigns().then(setCampaigns).catch(err => { throw err; }),
          fetchCropOperations().then(setCropOperations).catch(err => { throw err; }),
          fetchHarvests().then(setHarvests).catch(err => { throw err; }),
          fetchAnimals().then(setAnimals).catch(err => { throw err; }),
          fetchAnimalLots().then(setAnimalLots).catch(err => { throw err; }),
          fetchAnimalEvents().then(setAnimalEvents).catch(err => { throw err; }),
          fetchProjects().then(setProjects).catch(err => { throw err; }),
          fetchProjectSteps().then(setProjectSteps).catch(err => { throw err; }),
          fetchInventoryItems().then(setInventoryItems).catch(err => { throw err; }),
          fetchInventoryMovements().then(setInventoryMovements).catch(err => { throw err; }),
          fetchInventoryCounts().then(setInventoryCounts).catch(err => { throw err; }),
          fetchBudgets().then(setBudgets).catch(err => { throw err; }),
          fetchAlerts().then(setAlerts).catch(err => { throw err; }),
          fetchNotifications().then(setNotifications).catch(err => { throw err; }),
          fetchAuditLogs().then(setAuditLogs).catch(err => { throw err; }),
          fetchSiteContent().then(setSiteContent).catch(err => { throw err; }),
        ]);
      } else {
        // Clear private data if user cannot read fundings
        setFarm(null);
        setUsers([]);
        setFunders([]);
        setBankAccounts([]);
        setCashAccounts([]);
        setTransactions([]);
        setSuppliers([]);
        setExpenses([]);
        setDocuments([]);
        setSites([]);
        setPlots([]);
        setCampaigns([]);
        setCropOperations([]);
        setHarvests([]);
        setAnimals([]);
        setAnimalLots([]);
        setAnimalEvents([]);
        setProjects([]);
        setProjectSteps([]);
        setInventoryItems([]);
        setInventoryMovements([]);
        setInventoryCounts([]);
        setBudgets([]);
        setAlerts([]);
        setNotifications([]);
        setAuditLogs([]);
        setSiteContent({});
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Don't reset data here - keep previous data if available
    } finally {
      setLoading(false);
    }
  }, [mayReadFundings, fetchFarm, fetchUsers, fetchFunders, fetchBankAccounts, fetchCashAccounts,
      fetchTransactions, fetchSuppliers, fetchExpenses, fetchDocuments, fetchSites, fetchPlots,
      fetchCampaigns, fetchCropOperations, fetchHarvests, fetchAnimals, fetchAnimalLots,
      fetchAnimalEvents, fetchProjects, fetchProjectSteps, fetchInventoryItems,
      fetchInventoryMovements, fetchInventoryCounts, fetchBudgets, fetchAlerts,
      fetchNotifications, fetchAuditLogs, fetchSiteContent, fetchFundings]);

  const refresh = useCallback(() => {
    void fetchAllData();
  }, [fetchAllData]);

  useLayoutEffect(() => {
    const epoch = requestEpoch.next();

    // Fetch data on mount and when accessState changes
    void fetchAllData();

    return () => epoch.invalidate();
  }, [fetchAllData, requestEpoch]);

  return (
    <DataContext.Provider value={{
      farm,
      users,
      funders,
      fundings,
      bankAccounts,
      cashAccounts,
      transactions,
      suppliers,
      expenses,
      documents,
      sites,
      plots,
      campaigns,
      cropOperations,
      harvests,
      animals,
      animalLots,
      animalEvents,
      projects,
      projectSteps,
      inventoryItems,
      inventoryMovements,
      inventoryCounts,
      budgets,
      alerts,
      notifications,
      auditLogs,
      siteContent,
      loading,
      error,
      refresh,
    }}>
      {children}
    </DataContext.Provider>
  );
}