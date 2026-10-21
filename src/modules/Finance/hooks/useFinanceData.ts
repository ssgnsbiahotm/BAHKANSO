import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { supabase } from '@/lib/supabase';
import type { Transaction, Funding, Expense, Document } from '@/lib/types';

export const useTreasuryTransactions = (opts?: { page?: number; pageSize?: number }) => {
  const result = usePaginatedQuery<Transaction>({
    table: 'transactions',
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 50,
    orderBy: { column: 'transaction_date', ascending: false },
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useFundings = (opts?: { page?: number; pageSize?: number }) => {
  const result = usePaginatedQuery<Funding>({
    table: 'fundings',
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 50,
    orderBy: { column: 'date_sent', ascending: false },
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useExpenses = (opts?: { page?: number; pageSize?: number }) => {
  const result = usePaginatedQuery<Expense>({
    table: 'expenses',
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 50,
    orderBy: { column: 'date', ascending: false },
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useDocuments = (opts?: { page?: number; pageSize?: number }) => {
  const result = usePaginatedQuery<Document>({
    table: 'documents',
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 50,
    orderBy: { column: 'upload_date', ascending: false },
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};
