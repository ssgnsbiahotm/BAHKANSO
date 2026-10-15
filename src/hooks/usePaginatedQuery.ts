import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

// Types génériques pour la pagination
interface PaginatedQueryOptions<T> {
  table: keyof Database['public']['Tables'];
  columns?: string;
  filters?: Array<{
    column: string;
    operation: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';
    value: any;
  }>;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  page: number;
  pageSize: number;
}

interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Hook personnalisé pour la pagination des données avec Supabase et react-query
 */
export function usePaginatedQuery<T = any>(
  options: PaginatedQueryOptions<T>,
  enabled = true
) {
  const queryClient = useQueryClient();
  const {
    table,
    columns = '*',
    filters = [],
    orderBy,
    page = 1,
    pageSize = 10,
  } = options;

  // Construire la clé de query unique basée sur les paramètres
  const queryKey = [
    'paginated',
    table,
    columns,
    JSON.stringify(filters),
    JSON.stringify(orderBy),
    page,
    pageSize,
  ];

  // Fonction de récupération des données paginées
  const fetchPaginatedData = async (): Promise<PaginatedResult<T>> => {
    let query = supabase.from(table as string).select(`${columns}, count`, { count: 'exact' });

    // Appliquer les filtres
    filters.forEach(filter => {
      switch (filter.operation) {
        case 'eq':
          query = query.eq(filter.column, filter.value as any);
          break;
        case 'neq':
          query = query.neq(filter.column, filter.value as any);
          break;
        case 'gt':
          query = query.gt(filter.column, filter.value as any);
          break;
        case 'gte':
          query = query.gte(filter.column, filter.value as any);
          break;
        case 'lt':
          query = query.lt(filter.column, filter.value as any);
          break;
        case 'lte':
          query = query.lte(filter.column, filter.value as any);
          break;
        case 'like':
          query = query.like(filter.column, filter.value as string);
          break;
        case 'ilike':
          query = query.ilike(filter.column, filter.value as string);
          break;
        default:
          query = query.eq(filter.column, filter.value as any);
      }
    });

    // Appliquer le tri
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }

    // Appliquer la pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: data as T[],
      count: totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  };

  // Utiliser useQuery avec la fonction de récupération
  return useQuery<PaginatedResult<T>, Error>({
    queryKey,
    queryFn: fetchPaginatedData,
    enabled,
    // Garder les données précédentes pendant le rechargement
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook simplifié pour les requêtes non paginées (utilise react-query quand même pour le caching)
 */
export function useSimpleQuery<T = any>(
  table: keyof Database['public']['Tables'],
  options: {
    columns?: string;
    filters?: Array<{
      column: string;
      operation: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';
      value: any;
    }>;
    orderBy?: {
      column: string;
      ascending?: boolean;
    };
  },
  enabled = true
) {
  const { columns = '*', filters = [], orderBy } = options;

  const queryKey = [
    'simple',
    table,
    columns,
    JSON.stringify(filters),
    JSON.stringify(orderBy),
  ];

  const fetchSimpleData = async (): Promise<T[]> => {
    let query = supabase.from(table as string).select(columns);

    // Appliquer les filtres
    filters.forEach(filter => {
      switch (filter.operation) {
        case 'eq':
          query = query.eq(filter.column, filter.value as any);
          break;
        case 'neq':
          query = query.neq(filter.column, filter.value as any);
          break;
        case 'gt':
          query = query.gt(filter.column, filter.value as any);
          break;
        case 'gte':
          query = query.gte(filter.column, filter.value as any);
          break;
        case 'lt':
          query = query.lt(filter.column, filter.value as any);
          break;
        case 'lte':
          query = query.lte(filter.column, filter.value as any);
          break;
        case 'like':
          query = query.like(filter.column, filter.value as string);
          break;
        case 'ilike':
          query = query.ilike(filter.column, filter.value as string);
          break;
        default:
          query = query.eq(filter.column, filter.value as any);
      }
    });

    // Appliquer le tri
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as T[];
  };

  return useQuery<T[], Error>({
    queryKey,
    queryFn: fetchSimpleData,
    enabled,
  });
}