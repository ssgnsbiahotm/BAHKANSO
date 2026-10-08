/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useLayoutEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import { canReadFundings, createRequestEpoch, loadFundingRowsForAccess } from './access';
import type {
  Farm, AppUser, Funder, FundingSummary, BankAccount, CashAccount, Transaction,
  Supplier, Expense, Document, Site, Plot, Campaign, CropOperation, Harvest,
  Animal, AnimalLot, AnimalEvent, Project, ProjectStep, InventoryItem,
  InventoryMovement, InventoryCount, Budget, Alert, Notification, AuditLog,
  SiteContent, Recipe,
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
  const { accessState } = useAuth();
  const requestEpoch = useRef(createRequestEpoch());
  const mayReadFundings = canReadFundings(accessState);
  const [fundings, setFundings] = useState<FundingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const refresh = useCallback(() => {
    void loadFundingRowsForAccess(accessState, fetchFundings, requestEpoch.current, {
      setRows: setFundings,
      setLoading,
      setError,
      onError: loadError => console.error('Error loading funding data:', loadError),
    });
  }, [accessState, fetchFundings]);

  useLayoutEffect(() => {
    const epoch = requestEpoch.current;
    if (!mayReadFundings) {
      epoch.invalidate();
      setFundings([]);
      setError(null);
      setLoading(false);
      return;
    }

    void loadFundingRowsForAccess(accessState, fetchFundings, epoch, {
      setRows: setFundings,
      setLoading,
      setError,
      onError: loadError => console.error('Error loading funding data:', loadError),
    });
    return () => epoch.invalidate();
  }, [accessState, fetchFundings, mayReadFundings]);

  return (
    <DataContext.Provider value={{
      farm: null,
      users: [],
      funders: [],
      fundings: mayReadFundings ? fundings : [],
      bankAccounts: [],
      cashAccounts: [],
      transactions: [],
      suppliers: [],
      expenses: [],
      documents: [],
      sites: [],
      plots: [],
      campaigns: [],
      cropOperations: [],
      harvests: [],
      animals: [],
      animalLots: [],
      animalEvents: [],
      projects: [],
      projectSteps: [],
      inventoryItems: [],
      inventoryMovements: [],
      inventoryCounts: [],
      budgets: [],
      alerts: [],
      notifications: [],
      auditLogs: [],
      siteContent: {},
      recipes: [],
      loading: mayReadFundings && loading,
      error: mayReadFundings ? error : null,
      refresh,
    }}>
      {children}
    </DataContext.Provider>
  );
}
