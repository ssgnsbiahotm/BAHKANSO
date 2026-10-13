import { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatDate, formatNumber } from '@/lib/format';
import { FUNDING_STATUS_COLORS } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import type { FundingSummary } from '@/lib/types';

export function Fundings() {
  const { fundings } = useData();
  const kpis = useMemo(() => ({
    total: fundings.length,
    received: fundings.filter(funding => funding.status === 'reçu').length,
    inTransit: fundings.filter(funding => funding.status === 'en transit').length,
  }), [fundings]);

  const columns: Column<FundingSummary>[] = [
    {
      key: 'reference',
      label: 'Référence',
      sortable: true,
      render: funding => (
        <span className="font-mono text-xs font-medium text-slate-900">{funding.reference || '—'}</span>
      ),
    },
    {
      key: 'funder',
      label: 'Financeur',
      sortable: true,
      sortValue: funding => funding.funder?.name || '',
      render: funding => funding.funder?.name || '—',
    },
    {
      key: 'date_sent',
      label: 'Date envoyée',
      sortable: true,
      sortValue: funding => funding.date_sent,
      render: funding => formatDate(funding.date_sent),
    },
    {
      key: 'amount_sent',
      label: 'Montant envoyé',
      sortable: true,
      sortValue: funding => funding.amount_sent,
      render: funding => `${formatNumber(funding.amount_sent)} ${funding.currency_sent}`,
    },
    {
      key: 'amount_received',
      label: 'Montant reçu',
      sortable: true,
      sortValue: funding => funding.amount_received ?? 0,
      render: funding => formatNumber(funding.amount_received),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      sortValue: funding => funding.status,
      render: funding => <StatusBadge status={funding.status} colorMap={FUNDING_STATUS_COLORS} />,
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Financements"
        subtitle="Consultation en lecture seule"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Financements" value={String(kpis.total)} icon={<Wallet size={20} />} color="blue" />
        <KpiCard label="Reçus" value={String(kpis.received)} icon={<Wallet size={20} />} color="green" />
        <KpiCard label="En transit" value={String(kpis.inTransit)} icon={<Wallet size={20} />} color="amber" />
      </div>

      <DataTable
        columns={columns}
        data={fundings}
        rowKey={funding => funding.id}
        searchable
        searchKeys={funding => `${funding.reference || ''} ${funding.funder?.name || ''} ${funding.status}`}
        emptyMessage="Aucun financement accessible."
      />
    </div>
  );
}
