import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import type { Transaction, Funding, Expense, Document } from '@/lib/types';

const ROLES_ACCES_GLOBAL = ['administrateur', 'propriétaire'];

const siteFilters = (siteId: string | null) => {
  if (!siteId) return [];
  return [{ column: 'site_id', operation: 'eq', value: siteId }];
};

const isAccesGlobal = (appUser: { role: string | null } | null) => {
  if (!appUser?.role) return false;
  return ROLES_ACCES_GLOBAL.includes(appUser.role);
};

export const useTreasuryTransactions = (opts?: { page?: number; pageSize?: number }) => {
  const { appUser } = useAuth();
  const siteId = appUser?.site_id ?? null;
  const filters = isAccesGlobal(appUser) ? [] : siteFilters(siteId);
  const result = usePaginatedQuery<Transaction>({
    table: 'transactions',
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 50,
    orderBy: { column: 'transaction_date', ascending: false },
    filters,
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useFundings = (opts?: { page?: number; pageSize?: number }) => {
  const { appUser } = useAuth();
  const siteId = appUser?.site_id ?? null;
  const filters = isAccesGlobal(appUser) ? [] : siteFilters(siteId);
  const result = usePaginatedQuery<Funding>({
    table: 'fundings',
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 50,
    orderBy: { column: 'date_sent', ascending: false },
    filters,
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useExpenses = (opts?: { page?: number; pageSize?: number }) => {
  const { appUser } = useAuth();
  const siteId = appUser?.site_id ?? null;
  const filters = isAccesGlobal(appUser) ? [] : siteFilters(siteId);
  const result = usePaginatedQuery<Expense>({
    table: 'expenses',
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 50,
    orderBy: { column: 'date', ascending: false },
    filters,
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useDocuments = (opts?: { page?: number; pageSize?: number }) => {
  const { appUser } = useAuth();
  const siteId = appUser?.site_id ?? null;
  const filters = isAccesGlobal(appUser) ? [] : siteFilters(siteId);
  const result = usePaginatedQuery<Document>({
    table: 'documents',
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 50,
    orderBy: { column: 'upload_date', ascending: false },
    filters,
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};
