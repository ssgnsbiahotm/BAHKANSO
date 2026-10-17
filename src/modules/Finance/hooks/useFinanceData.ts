import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { supabase } from '@/lib/supabase';
import type { Transaction, Funding, Expense, Document } from '@/lib/types';

export const useTreasuryTransactions = () => {
  const result = usePaginatedQuery<Transaction>({
    table: 'transactions',
    page: 1,
    pageSize: 50,
    orderBy: { column: 'transaction_date', ascending: false },
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useFundings = () => {
  const result = usePaginatedQuery<Funding>({
    table: 'fundings',
    page: 1,
    pageSize: 50,
    orderBy: { column: 'date_sent', ascending: false },
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useExpenses = () => {
  const result = usePaginatedQuery<Expense>({
    table: 'expenses',
    page: 1,
    pageSize: 50,
    orderBy: { column: 'date', ascending: false },
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useDocuments = () => {
  const result = usePaginatedQuery<Document>({
    table: 'documents',
    page: 1,
    pageSize: 50,
    orderBy: { column: 'upload_date', ascending: false },
  });
  return {
    data: result.data?.data ?? [],
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};
