import { useSimpleQuery } from '@/hooks/usePaginatedQuery';
import { supabase } from '@/lib/supabase';
import type { Sale, Customer } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

export interface SaleWithRelations extends Sale {
  customer: Pick<Customer, 'id' | 'name' | 'type'> | null;
  site: { id: string; name: string; code: string | null } | null;
  items: Array<{ id: string; description: string | null; quantity: number; unit: string; unit_price: number; total: number }>;
}

export interface SalesStats {
  totalRevenue: number;
  salesCount: number;
  avgSale: number;
  bySite: Array<{ siteId: string; siteName: string; siteCode: string | null; total: number; count: number }>;
}

export function useSalesData() {
  // Requête ventes avec jointures customer + site + items
  const salesQuery = useSimpleQuery<SaleWithRelations>(
    'sales',
    {
      columns: '*, customer:customers(id,name,type), site:sites(id,name,code), items:sale_items(id,description,quantity,unit,unit_price,total)',
      orderBy: { column: 'date', ascending: false },
    },
    true
  );

  // Requête clients
  const customersQuery = useSimpleQuery<Customer>(
    'customers',
    {
      columns: '*',
      orderBy: { column: 'name', ascending: true },
    },
    true
  );

  // Calculer les stats
  const stats: SalesStats | null = salesQuery.data
    ? (() => {
        const sales = salesQuery.data;
        const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
        const salesCount = sales.length;
        const avgSale = salesCount > 0 ? totalRevenue / salesCount : 0;

        // Grouper par site
        const bySiteMap = new Map<string, { siteId: string; siteName: string; siteCode: string | null; total: number; count: number }>();
        sales.forEach(s => {
          const siteId = s.site?.id || 'sans-site';
          const siteName = s.site?.name || 'Sans site';
          const siteCode = s.site?.code || null;
          const existing = bySiteMap.get(siteId) || { siteId, siteName, siteCode, total: 0, count: 0 };
          existing.total += s.total_amount || 0;
          existing.count += 1;
          bySiteMap.set(siteId, existing);
        });

        return {
          totalRevenue,
          salesCount,
          avgSale,
          bySite: Array.from(bySiteMap.values()).sort((a, b) => b.total - a.total),
        };
      })()
    : null;

  return {
    sales: salesQuery.data ?? [],
    customers: customersQuery.data ?? [],
    stats,
    loading: salesQuery.isLoading || customersQuery.isLoading,
    error: salesQuery.error || customersQuery.error,
    refresh: () => {
      salesQuery.refetch();
      customersQuery.refetch();
    },
  };
}