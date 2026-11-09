import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { timeAgo } from '@/lib/format';
import { AuditLog } from '@/lib/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { AlertCircle, Loader2, Calendar, Search } from 'lucide-react';

interface EnrichedLog extends AuditLog {
  resolved_object: string;
}

export function HistoriqueTab() {
  useAuth();

  const [logs, setLogs] = useState<EnrichedLog[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      const { data: rawLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !rawLogs) return;

      const getIds = (type: string) =>
        rawLogs.filter((l: AuditLog) => l.object_type === type).map((l: AuditLog) => l.object_id).filter(Boolean);

      let sites: { data: null | { id: string; name: string }[]; error: null } = { data: null, error: null };
      let expenses: { data: null | { id: string; reference: string; description?: string }[]; error: null } = { data: null, error: null };
      let customers: { data: null | { id: string; name: string }[]; error: null } = { data: null, error: null };
      let funders: { data: null | { id: string; name: string }[]; error: null } = { data: null, error: null };
      let animals: { data: null | { id: string; identifier: string }[]; error: null } = { data: null, error: null };
      let projects: { data: null | { id: string; name: string }[]; error: null } = { data: null, error: null };
      let plots: { data: null | { id: string; name: string }[]; error: null } = { data: null, error: null };

      await Promise.allSettled([
        supabase.from('sites').select('id, name').in('id', getIds('site')).then(({ data, error }) => { sites = { data, error: error ? error as unknown as null : null }; }),
        supabase.from('expenses').select('id, reference, description').in('id', getIds('expense')).then(({ data, error }) => { expenses = { data, error: error ? error as unknown as null : null }; }),
        supabase.from('customers').select('id, name').in('id', getIds('customer')).then(({ data, error }) => { customers = { data, error: error ? error as unknown as null : null }; }),
        supabase.from('funders').select('id, name').in('id', getIds('funder')).then(({ data, error }) => { funders = { data, error: error ? error as unknown as null : null }; }),
        supabase.from('animals').select('id, identifier').in('id', getIds('animal')).then(({ data, error }) => { animals = { data, error: error ? error as unknown as null : null }; }),
        supabase.from('projects').select('id, name').in('id', getIds('project')).then(({ data, error }) => { projects = { data, error: error ? error as unknown as null : null }; }),
        supabase.from('plots').select('id, name').in('id', getIds('plot')).then(({ data, error }) => { plots = { data, error: error ? error as unknown as null : null }; }),
      ]);

      const resolveName = (type: string, id: string): string => {
        if (!id) return '—';
        switch (type) {
          case 'site': return sites.data?.find(s => s.id === id)?.name || id;
          case 'expense': {
            const exp = expenses.data?.find(e => e.id === id);
            return exp ? `${exp.reference} (${exp.description?.slice(0, 30) || 'sans description'})` : id;
          }
          case 'customer': return customers.data?.find(c => c.id === id)?.name || id;
          case 'funder': return funders.data?.find(f => f.id === id)?.name || id;
          case 'animal': return animals.data?.find(a => a.id === id)?.identifier || id;
          case 'project': return projects.data?.find(p => p.id === id)?.name || id;
          case 'plot': return plots.data?.find(p => p.id === id)?.name || id;
          default: return id.slice(0, 8) + '...';
        }
      };

      const enrichedLogs = rawLogs.map((log: AuditLog) => ({
        ...log,
        resolved_object: resolveName(log.object_type ?? '', log.object_id ?? ''),
      }));

      setLogs(enrichedLogs as EnrichedLog[]);
    }
    fetchLogs();
  }, []);

  const [dateFrom, setDateFrom] = useState<string>(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );

  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    const from = new Date(dateFrom).getTime();
    return (logs ?? []).filter((log: AuditLog) => {
      if (new Date(log.created_at).getTime() < from) return false;
      if (filterUser && log.user_id !== filterUser) return false;
      if (filterAction && log.action !== filterAction) return false;
      if (searchQuery && !String(log.description || log.title || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [logs, dateFrom, filterUser, filterAction, searchQuery]);

  const kpis = useMemo(() => {
    const data = logs ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const criterialogs = data.filter((l: AuditLog) => {
      const lDate = new Date(l.created_at);
      return lDate >= yesterday;
    });

    const lastAction = data.length > 0
      ? timeAgo(data[0].created_at)
      : 'aucune';

    const activeUsers = new Set<string>(data.map((l: AuditLog) => l.user_id).filter((id): id is string => id !== null)).size;

    const criticalActions = criterialogs.filter(
      (l: AuditLog) => l.action === 'DELETE' || l.action === 'UPDATE'
    ).length;

    return {
      total: data.length,
      today: data.filter((l: AuditLog) => {
        const lDate = new Date(l.created_at);
        const lToday = new Date(lDate);
        lToday.setHours(0, 0, 0, 0);
        return lToday.getTime() === today.getTime();
      }).length,
      lastAction,
      activeUsers,
      criticalActions,
    };
  }, [logs]);

  const users = useMemo(() => {
    const usersSet = new Set<string>();
    (logs ?? []).forEach((log: AuditLog) => { if (log.user_id) usersSet.add(log.user_id); });
    return Array.from(usersSet).map(id => {
      const log = (logs ?? []).find((l: AuditLog) => l.user_id === id);
      return { id, name: log?.user_name || `Utilisateur ${id.slice(0, 8)}...` };
    });
  }, [logs]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Historique des actions"
        subtitle="Journal d'activité et traçabilité"
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="hist-from" className="text-sm text-muted">Depuis le</label>
            <input
              id="hist-from"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-1 text-sm border border-default rounded-lg bg-surface"
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total actions" value={String(kpis.total)} icon={<Loader2 size={16} />} color="slate" />
        <KpiCard label="Aujourd'hui" value={String(kpis.today)} icon={<Calendar size={16} />} color="info" />
      </div>

      <details open className="mb-6">
        <summary className="cursor-pointer text-sm font-medium text-secondary hover:text-primary mb-2 select-none">
          Filtres
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-default rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Rechercher"
            />
          </div>
          <select
            value={filterUser || ''}
            onChange={(e) => setFilterUser(e.target.value || null)}
            className="px-3 py-2 text-sm border border-default rounded-lg bg-surface"
          >
            <option value="">Tous les utilisateurs</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select
            value={filterAction || ''}
            onChange={(e) => setFilterAction(e.target.value || null)}
            className="px-3 py-2 text-sm border border-default rounded-lg bg-surface"
          >
            <option value="">Toutes les actions</option>
            <option value="CREATE">Création</option>
            <option value="UPDATE">Modification</option>
            <option value="DELETE">Suppression</option>
          </select>
        </div>
      </details>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ minHeight: '200px' }}>
        {filteredLogs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted">
            <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
            <p>Aucune action enregistrée</p>
            <p className="text-sm">Les actions apparaissent ici à mesure que vous utilisez l'application</p>
          </div>
        ) : (
          filteredLogs.map((log: EnrichedLog) => (
            <div key={log.id} className={`bg-surface rounded-xl border p-4 ${log.status === 'résolue' ? 'border-default opacity-60' : ''} ${log.action === 'DELETE' ? 'ring-2 ring-red-500/20' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted text-sm">{timeAgo(log.created_at)}</span>
                    {log.user_name && <span>· {log.user_name}</span>}
                    <span className="ml-2 text-xs font-bold bg-red-100 text-red-800 rounded px-2 py-0.5">{log.action === 'DELETE' ? '🔴 DELETE' : log.action === 'UPDATE' ? '🔵 UPDATE' : '🟢 CREATE'}</span>
                  </div>
                  <h4 className="font-semibold text-primary">{log.action}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted capitalize">
                    {log.resolved_object || `ID ${log.object_id?.slice(0, 8) ?? '—'}`}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted truncate mt-2">{log.description || log.title || ''}</p>
              {log.object_type && (
                <p className="text-xs text-muted mt-1">
                  Cible: <a href={`/app/${log.object_type}/?id=${log.object_id}`} className="text-secondary underline hover:text-primary" target="_blank" rel="noopener noreferrer">
                    {log.resolved_object}
                  </a>
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
