import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/Toast';
import { formatDate, formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { AlertCircle, CheckCircle, Loader2, Calendar, Users, Filter, Search } from 'lucide-react';

export function HistoriqueTab() {
  const navigate = useNavigate();
  const location = useLocation();

  const { auditLogs, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();

  // Détecter l'onglet actif depuis l'URL (?tab=) ET le mettre à jour
  const [activeTab, setActiveTab] = useState<'tous' | 'hier' | 'semaine' | 'mois'>('tous');

  useEffect(() => {
    const search = location.search;
    if (search.includes('?tab=')) {
      const params = new URLSearchParams(search);
      const tab = params.get('tab');
      if (activeTab === 'hier') setActiveTab('hier');
      else if (tab === 'semaine') setActiveTab('semaine');
      else if (tab === 'mois') setActiveTab('mois');
    }
  }, [location.search]);

  // Synchroniser le changement d'onglet via navigation
  const handleTabChange = (tab: 'tous' | 'hier' | 'semaine' | 'mois') => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    params.set('tab', tab);
    navigate(`?${params.toString()}`, { replace: true });
  };

  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    return (auditLogs ?? []).filter((log: any) => {
      // Filtre date
      if (filterDate) {
        const logDate = new Date(log.created_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const logToday = new Date(logDate);
        logToday.setHours(0, 0, 0, 0);

        if (activeTab === 'hier') {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (logToday < yesterday) return false;
        } else if (activeTab === 'semaine') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (logToday < weekAgo) return false;
        } else if (activeTab === 'mois') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (logToday < monthAgo) return false;
        }
      }

      // Filtre utilisateur
      if (filterUser && log.user_id !== filterUser) return false;

      // Filtre action
      if (filterAction && log.action !== filterAction) return false;

      // Filtre recherche
      if (searchQuery && !String(log.description || log.title || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [auditLogs, filterDate, filterUser, filterAction, searchQuery, activeTab]);

  // KPIs
  const kpis = useMemo(() => {
    const data = auditLogs ?? [];
    return {
      total: data.length,
      today: data.filter((l: any) => {
        const lDate = new Date(l.created_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lToday = new Date(lDate);
        lToday.setHours(0, 0, 0, 0);
        return lToday.getTime() === today.getTime();
      }).length,
    };
  }, [auditLogs]);

  // Options de filtre
  const users = useMemo(() => {
    const usersSet = new Set<string>();
    (auditLogs ?? []).forEach((log: any) => usersSet.add(log.user_id));
    return Array.from(usersSet).map(id => ({ id, name: `Utilisateur ${id}` }));
  }, [auditLogs]);

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
        <KpiCard label="Total actions" value={String(kpis.total)} icon={<Loader2 size={16} />} color="dark" />
        <KpiCard label="Aujourd'hui" value={String(kpis.today)} icon={<Calendar size={16} />} color="blue" />
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
            <option key={u.id} value={u.id}>Utilisateur {u.id}</option>
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
          filteredLogs.map((log: any) => (
            <div key={log.id} className={`bg-white rounded-xl border p-4 ${log.status === 'résolue' ? 'border-slate-200 opacity-60' : ''}}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-400 text-sm">{formatDate(log.created_at)}</span>
                    {log.user_name && <span>· {log.user_name}</span>}
                  </div>
                  <h4 className="font-semibold text-slate-900">{log.action}</h4>
                </div>
                <div className="text-sm text-slate-400 capitalize">
                  {log.user_id}
                </div>
              </div>
              <p className="text-sm text-slate-500 truncate">{log.description || log.title || ''}</p>
              {log.target_type && (
                <p className="text-xs text-slate-400 mt-1">
                  Cible: {log.target_type} {log.target_id ? `#${log.target_id}` : ''}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}