import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import type {
  Farm, AppUser, Funder, Funding, BankAccount, CashAccount, Transaction,
  Supplier, Expense, Document, Site, Plot, Campaign, CropOperation, Harvest,
  Animal, AnimalLot, AnimalEvent, Project, ProjectStep, InventoryItem,
  InventoryMovement, InventoryCount, Budget, Alert, Notification, AuditLog,
  SiteContent, Media, Customer,
} from './types';

export type DashboardSource =
  | 'transactions'
  | 'expenses'
  | 'inventoryItems'
  | 'projects'
  | 'alerts'
  | 'animals'
  | 'animalLots'
  | 'campaigns';

export type SourceStatus = 'idle' | 'loading' | 'success' | 'error';

const DASHBOARD_SOURCES: DashboardSource[] = [
  'transactions',
  'expenses',
  'inventoryItems',
  'projects',
  'alerts',
  'animals',
  'animalLots',
  'campaigns',
];

// Sources chargées en priorité par le layout global (Header, Sidebar, SiteProvider…).
// Toujours présentes au mount, quel que soit le module demandé.
const GLOBAL_SOURCES: string[] = [
  'farm',
  'users',
  'funders',
  'customers',
  'siteContent',
  'media',
  'notifications',
  'alerts',
];

// Registre des sources par module. Chaque module déclare les sources dont il a besoin.
// Les sources globales sont ajoutées automatiquement par loadModule.
const MODULE_SOURCES: Record<string, string[]> = {
  dashboard: DASHBOARD_SOURCES as string[],
  exploitation: ['plots', 'sites', 'campaigns', 'cropOperations', 'harvests'],
  finance: ['suppliers', 'documents', 'fundings', 'bankAccounts', 'cashAccounts'],
  elevage: ['animals', 'animalLots', 'animalEvents'],
  ventes: ['customers'],
};

interface DataContextType {
  farm: Farm | null;
  users: AppUser[];
  funders: Funder[];
  customers: Customer[];
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
  animaux: Animal[];
  animauxSetter: (v: Animal[]) => void;
  animalLots: AnimalLot[];
  lots: AnimalLot[];
  lotsSetter: (v: AnimalLot[]) => void;
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
  media: Media[];
  loading: boolean;
  error: string | null;
  sourceStatus: Record<string, SourceStatus>;
  sourceError: Record<string, string | null>;
  refresh: () => void;
  loadModule: (moduleName: string) => void;
  loadedModules: Set<string>;
  currentModule: string;
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
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [, setAnimaux] = useState<Animal[]>([]);
  const [animalLots, setAnimalLots] = useState<AnimalLot[]>([]);
  const [, setLots] = useState<AnimalLot[]>([]);
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
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<Record<string, SourceStatus>>({});
  const [sourceError, setSourceError] = useState<Record<string, string | null>>({});
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());
  const [currentModule, setCurrentModule] = useState<string>('dashboard');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Les huit sources du Dashboard passent en chargement ; leurs données
    // précédemment valides sont conservées jusqu'à application effective.
    const nextStatus: Record<string, SourceStatus> = {};
    const nextSourceError: Record<string, string | null> = {};
    for (const source of DASHBOARD_SOURCES) {
      nextStatus[source] = 'loading';
      nextSourceError[source] = null;
    }
    setSourceStatus({ ...nextStatus });
    setSourceError({ ...nextSourceError });

    const results = await Promise.all([
      safeRequest(supabase.from('farms').select('*').limit(1).maybeSingle()),
      safeRequest(supabase.from('app_users').select('*').order('name')),
      safeRequest(supabase.from('funders').select('*').order('name')),
      safeRequest(supabase.from('customers').select('*').order('name')),
      safeRequest(supabase.from('fundings').select('*, funder:funders(*)').order('date_sent', { ascending: false })),
      safeRequest(supabase.from('bank_accounts').select('*').order('name')),
      safeRequest(supabase.from('cash_accounts').select('*').order('name')),
      safeRequest(supabase.from('transactions').select('*').order('transaction_date', { ascending: false })),
      safeRequest(supabase.from('suppliers').select('*').order('name')),
      safeRequest(supabase.from("expenses").select("*, supplier:suppliers(*), funding:fundings(*)").order("date", { ascending: false })),
      safeRequest(supabase.from('documents').select('*').order('upload_date', { ascending: false })),
      safeRequest(supabase.from('sites').select('*').order('name')),
      safeRequest(supabase.from('plots').select('*').order('name')),
      safeRequest(supabase.from('campaigns').select('*, plot:plots(*)').order('year', { ascending: false })),
      safeRequest(supabase.from('crop_operations').select('*').order('date', { ascending: false })),
      safeRequest(supabase.from('harvests').select('*').order('date', { ascending: false })),
      safeRequest(supabase.from('animals').select('*').order('identifier')),
      safeRequest(supabase.from('animal_lots').select('*').order('identifier')),
      safeRequest(supabase.from('animal_events').select('*').order('date', { ascending: false })),
      safeRequest(supabase.from('projects').select('*').order('name')),
      safeRequest(supabase.from('project_steps').select('*').order('name')),
      safeRequest(supabase.from('inventory_items').select('*').order('name')),
      safeRequest(supabase.from('inventory_movements').select('*, item:inventory_items(*)').order('date', { ascending: false })),
      safeRequest(supabase.from('inventory_counts').select('*, item:inventory_items(*)').order('count_date', { ascending: false })),
      safeRequest(supabase.from('budgets').select('*').order('object_name')),
      safeRequest(supabase.from('alerts').select('*').order('created_at', { ascending: false })),
      safeRequest(supabase.from('notifications').select('*').order('created_at', { ascending: false })),
      safeRequest(supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)),
      safeRequest(supabase.from('site_content').select('*')),
      safeRequest(supabase.from('media').select('*').order('created_at', { ascending: false })),
    ]);

    const [
      farmRes, usersRes, fundersRes, customersRes, fundingsRes, bankRes, cashRes,
      txnRes, suppliersRes, expensesRes, docsRes, sitesRes, plotsRes,
      campaignsRes, cropOpsRes, harvestsRes, animalsRes, lotsRes,
      animalEventsRes, projectsRes, stepsRes, invItemsRes, invMovRes,
      invCountsRes, budgetsRes, alertsRes, notifRes, auditRes, siteContentRes,
      mediaRes,
    ] = results;

    let globalError: string | null = null;
    const fail = (message: string) => { if (!globalError) globalError = message; };

    // Sources non-Dashboard : comportement général préservé (données appliquées,
    // erreur globale enregistrée sans interrompre le reste du chargement).
    if (farmRes.error) fail(farmRes.error?.message || 'Erreur de chargement');
    setFarm(farmRes.data);
    if (usersRes.error) fail(usersRes.error?.message || 'Erreur de chargement');
    setUsers(usersRes.data || []);
    if (fundersRes.error) fail(fundersRes.error?.message || 'Erreur de chargement');
    setFunders(fundersRes.data || []);
    if (customersRes.error) fail(customersRes.error?.message || 'Erreur de chargement');
    setCustomers(customersRes.data || []);
    if (fundingsRes.error) fail(fundingsRes.error?.message || 'Erreur de chargement');
    setFundings(fundingsRes.data || []);
    if (bankRes.error) fail(bankRes.error?.message || 'Erreur de chargement');
    setBankAccounts(bankRes.data || []);
    if (cashRes.error) fail(cashRes.error?.message || 'Erreur de chargement');
    setCashAccounts(cashRes.data || []);
    if (suppliersRes.error) fail(suppliersRes.error?.message || 'Erreur de chargement');
    setSuppliers(suppliersRes.data || []);
    if (docsRes.error) fail(docsRes.error?.message || 'Erreur de chargement');
    setDocuments(docsRes.data || []);
    if (sitesRes.error) fail(sitesRes.error?.message || 'Erreur de chargement');
    setSites(sitesRes.data || []);
    if (plotsRes.error) fail(plotsRes.error?.message || 'Erreur de chargement');
    setPlots(plotsRes.data || []);
    if (cropOpsRes.error) fail(cropOpsRes.error?.message || 'Erreur de chargement');
    setCropOperations(cropOpsRes.data || []);
    if (harvestsRes.error) fail(harvestsRes.error?.message || 'Erreur de chargement');
    setHarvests(harvestsRes.data || []);
    if (animalEventsRes.error) fail(animalEventsRes.error?.message || 'Erreur de chargement');
    setAnimalEvents(animalEventsRes.data || []);
    if (stepsRes.error) fail(stepsRes.error?.message || 'Erreur de chargement');
    setProjectSteps(stepsRes.data || []);
    if (invMovRes.error) fail(invMovRes.error?.message || 'Erreur de chargement');
    setInventoryMovements(invMovRes.data || []);
    if (invCountsRes.error) fail(invCountsRes.error?.message || 'Erreur de chargement');
    setInventoryCounts(invCountsRes.data || []);
    if (budgetsRes.error) fail(budgetsRes.error?.message || 'Erreur de chargement');
    setBudgets(budgetsRes.data || []);
    if (notifRes.error) fail(notifRes.error?.message || 'Erreur de chargement');
    setNotifications(notifRes.data || []);
    if (auditRes.error) fail(auditRes.error?.message || 'Erreur de chargement');
    setAuditLogs(auditRes.data || []);
    if (siteContentRes.error) fail(siteContentRes.error?.message || 'Erreur de chargement');
    const contentMap: Record<string, SiteContent> = {};
    for (const row of (siteContentRes.data || [])) {
      contentMap[row.key] = row as SiteContent;
    }
    setSiteContent(contentMap);
    if (mediaRes.error) fail(mediaRes.error?.message || 'Erreur de chargement');
    setMedia((mediaRes.data as Media[]) || []);

    // Huit sources du Dashboard : statut ciblé par source.
    // En cas d'erreur, on ne remplace PAS les dernières données valides par [] :
    // on conserve l'état précédent et on marque la source indisponible.
    if (txnRes.error) {
      nextStatus.transactions = 'error';
      nextSourceError.transactions = txnRes.error?.message || 'Erreur de chargement';
    } else {
      nextStatus.transactions = 'success';
      nextSourceError.transactions = null;
      setTransactions(txnRes.data || []);
    }
    if (expensesRes.error) {
      nextStatus.expenses = 'error';
      nextSourceError.expenses = expensesRes.error?.message || 'Erreur de chargement';
    } else {
      nextStatus.expenses = 'success';
      nextSourceError.expenses = null;
      setExpenses(expensesRes.data || []);
    }
    if (invItemsRes.error) {
      nextStatus.inventoryItems = 'error';
      nextSourceError.inventoryItems = invItemsRes.error?.message || 'Erreur de chargement';
    } else {
      nextStatus.inventoryItems = 'success';
      nextSourceError.inventoryItems = null;
      setInventoryItems(invItemsRes.data || []);
    }
    if (projectsRes.error) {
      nextStatus.projects = 'error';
      nextSourceError.projects = projectsRes.error?.message || 'Erreur de chargement';
    } else {
      nextStatus.projects = 'success';
      nextSourceError.projects = null;
      setProjects(projectsRes.data || []);
    }
    if (alertsRes.error) {
      nextStatus.alerts = 'error';
      nextSourceError.alerts = alertsRes.error?.message || 'Erreur de chargement';
    } else {
      nextStatus.alerts = 'success';
      nextSourceError.alerts = null;
      setAlerts(alertsRes.data || []);
    }
    if (animalsRes.error) {
      nextStatus.animals = 'error';
      nextSourceError.animals = animalsRes.error?.message || 'Erreur de chargement';
    } else {
      nextStatus.animals = 'success';
      nextSourceError.animals = null;
      setAnimals(animalsRes.data || []);
      setAnimaux(animalsRes.data || []);
    }
    if (lotsRes.error) {
      nextStatus.animalLots = 'error';
      nextSourceError.animalLots = lotsRes.error?.message || 'Erreur de chargement';
    } else {
      nextStatus.animalLots = 'success';
      nextSourceError.animalLots = null;
      setAnimalLots(lotsRes.data || []);
      setLots(lotsRes.data || []);
    }
    if (campaignsRes.error) {
      nextStatus.campaigns = 'error';
      nextSourceError.campaigns = campaignsRes.error?.message || 'Erreur de chargement';
    } else {
      nextStatus.campaigns = 'success';
      nextSourceError.campaigns = null;
      setCampaigns(campaignsRes.data || []);
    }

    // Le statut "prêt" n'est annoncé qu'une fois les données appliquées au
    // contexte (même appel de rendu que les setters ci-dessus).
    setSourceStatus({ ...nextStatus });
    setSourceError({ ...nextSourceError });
    setError(globalError);
    setLoading(false);
  }, []);

  const safeRequest = <T,>(p: PromiseLike<{ data: T | null; error: unknown }>) =>
    Promise.resolve(p).then((r) => r as { data: T | null; error: unknown }).catch((err) => ({ data: null, error: err }));

  const loadModule = useCallback(async (moduleName: string) => {
    const sources = [...GLOBAL_SOURCES, ...(MODULE_SOURCES[moduleName] || [])];
    const toLoad = sources.filter((s) => !loadedModules.has(s));
    if (toLoad.length === 0) {
      setCurrentModule(moduleName);
      return;
    }

    setLoading(true);
    setError(null);

    const nextStatus: Record<string, SourceStatus> = {};
    const nextSourceError: Record<string, string | null> = {};
    for (const source of toLoad) {
      nextStatus[source] = 'loading';
      nextSourceError[source] = null;
    }
    setSourceStatus((prev) => ({ ...prev, ...nextStatus }));
    setSourceError((prev) => ({ ...prev, ...nextSourceError }));

    const sourceToQuery: Record<string, Promise<{ data: unknown; error: unknown }>> = {
      farm: safeRequest(supabase.from('farms').select('*').limit(1).maybeSingle()),
      users: safeRequest(supabase.from('app_users').select('*').order('name')),
      funders: safeRequest(supabase.from('funders').select('*').order('name')),
      customers: safeRequest(supabase.from('customers').select('*').order('name')),
      fundings: safeRequest(supabase.from('fundings').select('*, funder:funders(*)').order('date_sent', { ascending: false })),
      bankAccounts: safeRequest(supabase.from('bank_accounts').select('*').order('name')),
      cashAccounts: safeRequest(supabase.from('cash_accounts').select('*').order('name')),
      transactions: safeRequest(supabase.from('transactions').select('*').order('transaction_date', { ascending: false })),
      suppliers: safeRequest(supabase.from('suppliers').select('*').order('name')),
      expenses: safeRequest(supabase.from("expenses").select("*, supplier:suppliers(*), funding:fundings(*)").order("date", { ascending: false })),
      documents: safeRequest(supabase.from('documents').select('*').order('upload_date', { ascending: false })),
      sites: safeRequest(supabase.from('sites').select('*').order('name')),
      plots: safeRequest(supabase.from('plots').select('*').order('name')),
      campaigns: safeRequest(supabase.from('campaigns').select('*, plot:plots(*)').order('year', { ascending: false })),
      cropOperations: safeRequest(supabase.from('crop_operations').select('*').order('date', { ascending: false })),
      harvests: safeRequest(supabase.from('harvests').select('*').order('date', { ascending: false })),
      animals: safeRequest(supabase.from('animals').select('*').order('identifier')),
      animalLots: safeRequest(supabase.from('animal_lots').select('*').order('identifier')),
      animalEvents: safeRequest(supabase.from('animal_events').select('*').order('date', { ascending: false })),
      projects: safeRequest(supabase.from('projects').select('*').order('name')),
      projectSteps: safeRequest(supabase.from('project_steps').select('*').order('name')),
      inventoryItems: safeRequest(supabase.from('inventory_items').select('*').order('name')),
      inventoryMovements: safeRequest(supabase.from('inventory_movements').select('*, item:inventory_items(*)').order('date', { ascending: false })),
      inventoryCounts: safeRequest(supabase.from('inventory_counts').select('*, item:inventory_items(*)').order('count_date', { ascending: false })),
      budgets: safeRequest(supabase.from('budgets').select('*').order('object_name')),
      alerts: safeRequest(supabase.from('alerts').select('*').order('created_at', { ascending: false })),
      notifications: safeRequest(supabase.from('notifications').select('*').order('created_at', { ascending: false })),
      auditLogs: safeRequest(supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)),
      siteContent: safeRequest(supabase.from('site_content').select('*')),
      media: safeRequest(supabase.from('media').select('*').order('created_at', { ascending: false })),
    };

    let globalError: string | null = null;
    const fail = (message: string) => { if (!globalError) globalError = message; };

    const results: Record<string, { data: unknown; error: unknown }> = {};
    for (const source of toLoad) {
      results[source] = await sourceToQuery[source];
    }

    const applySource = (source: string, res: { data: unknown; error: unknown }) => {
      const errorMessage = (typeof res.error === 'object' && res.error !== null && 'message' in res.error && typeof res.error.message === 'string' ? res.error.message : undefined) || 'Erreur de chargement';
      if (res.error) {
        fail(errorMessage);
        nextStatus[source] = 'error';
        nextSourceError[source] = errorMessage;
        return;
      }
      nextStatus[source] = 'success';
      nextSourceError[source] = null;

      switch (source) {
        case 'farm': setFarm(res.data as Farm | null); break;
        case 'users': setUsers(res.data as AppUser[] || []); break;
        case 'funders': setFunders(res.data as Funder[] || []); break;
        case 'customers': setCustomers(res.data as Customer[] || []); break;
        case 'fundings': setFundings(res.data as Funding[] || []); break;
        case 'bankAccounts': setBankAccounts(res.data as BankAccount[] || []); break;
        case 'cashAccounts': setCashAccounts(res.data as CashAccount[] || []); break;
        case 'transactions': setTransactions(res.data as Transaction[] || []); break;
        case 'suppliers': setSuppliers(res.data as Supplier[] || []); break;
        case 'expenses': setExpenses(res.data as Expense[] || []); break;
        case 'documents': setDocuments(res.data as Document[] || []); break;
        case 'sites': setSites(res.data as Site[] || []); break;
        case 'plots': setPlots(res.data as Plot[] || []); break;
        case 'campaigns': setCampaigns(res.data as Campaign[] || []); break;
        case 'cropOperations': setCropOperations(res.data as CropOperation[] || []); break;
        case 'harvests': setHarvests(res.data as Harvest[] || []); break;
        case 'animals': {
          setAnimals(res.data as Animal[] || []);
          setAnimaux(res.data as Animal[] || []);
          break;
        }
        case 'animalLots': {
          setAnimalLots(res.data as AnimalLot[] || []);
          setLots(res.data as AnimalLot[] || []);
          break;
        }
        case 'animalEvents': setAnimalEvents(res.data as AnimalEvent[] || []); break;
        case 'projects': setProjects(res.data as Project[] || []); break;
        case 'projectSteps': setProjectSteps(res.data as ProjectStep[] || []); break;
        case 'inventoryItems': setInventoryItems(res.data as InventoryItem[] || []); break;
        case 'inventoryMovements': setInventoryMovements(res.data as InventoryMovement[] || []); break;
        case 'inventoryCounts': setInventoryCounts(res.data as InventoryCount[] || []); break;
        case 'budgets': setBudgets(res.data as Budget[] || []); break;
        case 'alerts': setAlerts(res.data as Alert[] || []); break;
        case 'notifications': setNotifications(res.data as Notification[] || []); break;
        case 'auditLogs': setAuditLogs(res.data as AuditLog[] || []); break;
        case 'siteContent': {
          const contentMap: Record<string, SiteContent> = {};
          for (const row of (res.data as SiteContent[] || [])) {
            contentMap[row.key] = row as SiteContent;
          }
          setSiteContent(contentMap);
          break;
        }
        case 'media': setMedia((res.data as Media[]) || []); break;
      }
    };

    for (const source of toLoad) {
      applySource(source, results[source]);
    }

    setSourceStatus((prev) => ({ ...prev, ...nextStatus }));
    setSourceError((prev) => ({ ...prev, ...nextSourceError }));
    setError(globalError);
    setLoading(false);
    setLoadedModules((prev) => new Set([...prev, ...toLoad]));
    setCurrentModule(moduleName);
  }, [loadedModules]);

  useEffect(() => {
    if (authUser) {
      loadModule('dashboard');
    } else {
      setLoading(false);
    }
  }, [authUser, loadModule]);

  return (
    <DataContext.Provider value={{
      farm, users, funders, customers, fundings, bankAccounts, cashAccounts, transactions,
      suppliers, expenses, documents, sites, plots, campaigns, cropOperations,
      harvests, animals, animaux: animals, animauxSetter: setAnimaux, animalLots, lots: animalLots, lotsSetter: setLots, animalEvents, projects, projectSteps,
      inventoryItems, inventoryMovements, inventoryCounts, budgets, alerts,
      notifications, auditLogs, siteContent, media,
      loading, error, sourceStatus, sourceError, refresh: loadAll, loadModule, loadedModules, currentModule,
    }}>
      {children}
    </DataContext.Provider>
  );
}
