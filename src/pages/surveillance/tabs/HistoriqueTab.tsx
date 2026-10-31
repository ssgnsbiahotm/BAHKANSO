import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();

  useAuth();

  const [logs, setLogs] = useState<EnrichedLog[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);

      const { data: rawLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !rawLogs) { setLoading(false); return; }

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
        supabase.from('sites').select('id, name').in('id', getIds('site')).then(r => { sites = r; }),
        supabase.from('expenses').select('id, reference, description').in('id', getIds('expense')).then(r => { expenses = r; }),
        supabase.from('customers').select('id, name').in('id', getIds('customer')).then(r => { customers = r; }),
        supabase.from('funders').select('id, name').in('id', getIds('funder')).then(r => { funders = r; }),
        supabase.from('animals').select('id, identifier').in('id', getIds('animal')).then(r => { animals = r; }),
        supabase.from('projects').select('id, name').in('id', getIds('project')).then(r => { projects = r; }),
        supabase.from('plots').select('id, name').in('id', getIds('plot')).then(r => { plots = r; }),
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

  const [activeTab, setActiveTab] = useState<'tous' | 'hier' | 'semaine' | 'mois'>('tous');

  useEffect(() => {
    const search = location.search;
    if (search.includes('?tab=')) {
      const params = new URLSearchParams(search);
      const tab = params.get('tab');
      if (tab === 'hier') setActiveTab('hier');
      else if (tab === 'semaine') setActiveTab('semaine');
      else if (tab === 'mois') setActiveTab('mois');
    }
  }, [location.search]);

  const handleTabChange = (tab: 'tous' | 'hier' | 'semaine' | 'mois') => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    params.set('tab', tab);
    navigate(`?${params.toString()}`, { replace: true });
  };

  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    return (logs ?? []).filter((log: AuditLog) => {
      if (filterUser && log.user_id !== filterUser) return false;
      if (filterAction && log.action !== filterAction) return false;
      if (searchQuery && !String(log.description || log.title || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [logs, filterUser, filterAction, searchQuery]);

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

    const activeUsers = new Set(data.map((l: AuditLog) => l.user_id)).size;

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
    (logs ?? []).forEach((log: AuditLog) => usersSet.add(log.user_id));
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
          <div className="flex gap-2">
            <button
              onClick={() => handleTabChange('tous')}
              className={activeTab === 'tous' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700 px-3 py-1 rounded'}
            >
              Tout
            </button>
            <button
              onClick={() => handleTabChange('hier')}
              className={activeTab === 'hier' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700 px-3 py-1 rounded'}
            >
              Hier
            </button>
            <button
              onClick={() => handleTabChange('semaine')}
              className={activeTab === 'semaine' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700 px-3 py-1 rounded'}
            >
              Semaine
            </button>
            <button
              onClick={() => handleTabChange('mois')}
              className={activeTab === 'mois' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700 px-3 py-1 rounded'}
            >
              Mois
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total actions" value={String(kpis.total)} icon={<Loader2 size={16} />} color="slate" />
        <KpiCard label="Aujourd'hui" value={String(kpis.today)} icon={<Calendar size={16} />} color="info" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="Rechercher"
          />
        </div>
        <select
          value={filterUser || ''}
          onChange={(e) => setFilterUser(e.target.value || null)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="">Tous les utilisateurs</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select
          value={filterAction || ''}
          onChange={(e) => setFilterAction(e.target.value || null)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="">Toutes les actions</option>
          <option value="CREATE">Création</option>
          <option value="UPDATE">Modification</option>
          <option value="DELETE">Suppression</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ minHeight: '200px' }}>
        {filteredLogs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
            <p>Aucune action enregistrée</p>
            <p className="text-sm">Les actions apparaissent ici à mesure que vous utilisez l'application</p>
          </div>
        ) : (
          filteredLogs.map((log: AuditLog) => (
            <div key={log.id} className={`bg-white rounded-xl border p-4 ${log.status === 'résolue' ? 'border-slate-200 opacity-60' : ''} ${log.action === 'DELETE' ? 'ring-2 ring-red-500/20' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-400 text-sm">{timeAgo(log.created_at)}</span>
                    {log.user_name && <span>· {log.user_name}</span>}
                    <span className="ml-2 text-xs font-bold bg-red-100 text-red-800 rounded px-2 py-0.5">{log.action === 'DELETE' ? '🔴 DELETE' : log.action === 'UPDATE' ? '🔵 UPDATE' : '🟢 CREATE'}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900">{log.action}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400 capitalize">
                    {log.resolved_object || `ID ${log.object_id?.slice(0, 8) ?? '—'}`}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500 truncate mt-2">{log.description || log.title || ''}</p>
              {log.object_type && (
                <p className="text-xs text-slate-400 mt-1">
                  Cible: <a href={`/app/${log.object_type}/?id=${log.object_id}`} className="text-slate-600 underline hover:text-slate-800" target="_blank" rel="noopener noreferrer">
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
