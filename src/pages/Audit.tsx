import { useMemo, useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  VALIDATE: 'green',
  REJECT: 'red',
  CANCEL: 'amber',
  DELETE_ATTEMPT: 'red',
  ATTACH_DOCUMENT: 'blue',
  LOGIN: 'gray',
  LOGOUT: 'gray',
};

export function Audit() {
  const { auditLogs } = useData();
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [search, setSearch] = useState('');

  const users = useMemo(() => {
    const set = new Set(auditLogs.map(l => l.user_name).filter(Boolean));
    return Array.from(set);
  }, [auditLogs]);

  const actions = useMemo(() => {
    const set = new Set(auditLogs.map(l => l.action));
    return Array.from(set);
  }, [auditLogs]);

  const filtered = useMemo(() => {
    return auditLogs.filter(l => {
      if (filterUser !== 'all' && l.user_name !== filterUser) return false;
      if (filterAction !== 'all' && l.action !== filterAction) return false;
      if (search && !`${l.description} ${l.object_type} ${l.object_id}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [auditLogs, filterUser, filterAction, search]);

  const kpis = useMemo(() => ({
    total: auditLogs.length,
    creates: auditLogs.filter(l => l.action === 'CREATE').length,
    validates: auditLogs.filter(l => l.action === 'VALIDATE').length,
    rejects: auditLogs.filter(l => l.action === 'REJECT' || l.action === 'CANCEL').length,
  }), [auditLogs]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Audit" subtitle="Journal d'activité immuable de l'exploitation" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total événements" value={String(kpis.total)} icon={<ScrollText size={20} />} color="dark" />
        <KpiCard label="Créations" value={String(kpis.creates)} icon={<ScrollText size={20} />} color="green" />
        <KpiCard label="Validations" value={String(kpis.validates)} icon={<ScrollText size={20} />} color="blue" />
        <KpiCard label="Rejets/Annulations" value={String(kpis.rejects)} icon={<ScrollText size={20} />} color="red" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20" />
        </div>
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
          <option value="all">Tous les utilisateurs</option>
          {users.map(u => <option key={u || ''} value={u || ''}>{u}</option>)}
        </select>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
          <option value="all">Toutes les actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Objet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{log.user_name || '—'}</td>
                  <td className="px-4 py-3"><SimpleBadge color={ACTION_COLORS[log.action] || 'gray'}>{log.action}</SimpleBadge></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.object_type || '—'} {log.object_id ? `· ${log.object_id}` : ''}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
