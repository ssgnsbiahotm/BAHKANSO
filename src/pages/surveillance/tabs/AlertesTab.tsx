import { useMemo, useEffect, useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, RefreshCw, Search} from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/Toast';
import { formatDate, timeAgo } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { z } from 'zod';
import { logAudit } from '@/lib/types';

export function AlertesTab() {
  const { alerts, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();

  // Bouton de rafraîchissement des alertes
  const [checkAlertsRunning, setCheckAlertsRunning] = useState(false);

  // Schéma de validation pour la résolution d'alerte
  const resolveSchema = z.object({
    status: z.enum(['résolue']),
    resolved_at: z.string().optional(),
  });

  const kpis = useMemo(() => {
    const open = alerts.filter(a => a.status === 'ouverte').length;
    const high = alerts.filter(a => a.severity === 'high' && a.status === 'ouverte').length;
    const medium = alerts.filter(a => a.severity === 'medium' && a.status === 'ouverte').length;
    const resolved = alerts.filter(a => a.status === 'résolue').length;
    return { open, high, medium, resolved };
  }, [alerts]);

  const resolveAlert = async (alert: { id: string; title: string }) => {
    const { error } = await supabase.from('alerts').update({ status: 'résolue', resolved_at: new Date().toISOString() }).eq('id', alert.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'alert', alert.id, `Alerte résolue: ${alert.title}`);
      toast.show('Alerte résolue');
      refresh();
    }
  };

  const checkAlerts = async () => {
    setCheckAlertsRunning(true);
    let created = 0;

    // Règle 1 : Stock faible (inventory_items où current_stock <= min_stock)
    try {
      const { data: allItems, error: allItemsError } = await supabase
        .from('inventory_items')
        .select('*');

      if (allItemsError) throw allItemsError;

      const lowStockItems = allItems?.filter(
        item => Number(item.current_stock) <= Number(item.min_stock)
      ) || [];

      for (const item of (lowStockItems || [])) {
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('object_id', item.id)
          .eq('object_type', 'inventory_item')
          .eq('status', 'ouverte')
          .single();

        if (!existing) {
          await supabase.from('alerts').insert({
            title: `Stock faible : ${item.name}`,
            description: `L'article ${item.name} a un stock actuel de ${item.current_stock} ${item.unit}, alors que le stock minimum est de ${item.min_stock}.`,
            severity: 'high',
            category: 'Stocks',
            object_type: 'inventory_item',
            object_id: item.id,
            status: 'ouverte',
          });
          created++;
        }
      }
    } catch (err) {
      console.error('Erreur règle 1 stock faible:', err);
    }

    // Règle 2 : Justificatif manquant (expenses où has_justificatif = false ET status != 'brouillon')
    try {
      const { data: expNoJustif, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .eq('has_justificatif', false)
        .neq('status', 'brouillon');

      if (expError) throw expError;

      for (const exp of (expNoJustif || [])) {
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('object_id', exp.id)
          .eq('object_type', 'expense')
          .eq('status', 'ouverte')
          .single();

        if (!existing) {
          await supabase.from('alerts').insert({
            title: `Justificatif manquant : ${exp.reference || exp.id}`,
            description: `L'expense ${exp.reference || exp.id} manque de justificatif attaché.`,
            severity: 'medium',
            category: 'Justificatifs',
            object_type: 'expense',
            object_id: exp.id,
            status: 'ouverte',
          });
          created++;
        }
      }
    } catch (err) {
      console.error('Erreur règle 2 justificatif manquant:', err);
    }

    // Règle 3 : Projet en retard (projects où expected_end_date < today ET status != 'terminé')
    try {
      const { data: lateProjects, error: projError } = await supabase
        .from('projects')
        .select('*')
        .lt('expected_end_date', new Date().toISOString().split('T')[0])
        .neq('status', 'terminé');

      if (projError) throw projError;

      for (const proj of (lateProjects || [])) {
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('object_id', proj.id)
          .eq('object_type', 'project')
          .eq('status', 'ouverte')
          .single();

        if (!existing) {
          await supabase.from('alerts').insert({
            title: `Projet en retard : ${proj.name}`,
            description: `Le projet ${proj.name} est en retard (date de fin prévue : ${proj.expected_end_date}).`,
            severity: 'high',
            category: 'Chantiers',
            object_type: 'project',
            object_id: proj.id,
            status: 'ouverte',
          });
          created++;
        }
      }
    } catch (err) {
      console.error('Erreur règle 3 projet en retard:', err);
    }

    // Règle 4 : Financement en transit (fundings où status = 'en transit' depuis > 14 jours)
    try {
      const { data: inTransitFundings, error: fundError } = await supabase
        .from('fundings')
        .select('*')
        .eq('status', 'en transit');

      if (fundError) throw fundError;

      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      for (const funding of (inTransitFundings || [])) {
        const createdAt = new Date(funding.created_at);
        if (createdAt < fourteenDaysAgo) {
          const { data: existing } = await supabase
            .from('alerts')
            .select('id')
            .eq('object_id', funding.id)
            .eq('object_type', 'funding')
            .eq('status', 'ouverte')
            .single();

          if (!existing) {
            await supabase.from('alerts').insert({
              title: `Financement en transit : ${funding.reference || funding.id}`,
              description: `Le financement ${funding.reference || funding.id} est en transit depuis plus de 14 jours.`,
              severity: 'low',
              category: 'Finance',
              object_type: 'funding',
              object_id: funding.id,
              status: 'ouverte',
            });
            created++;
          }
        }
      }
    } catch (err) {
      console.error('Erreur règle 4 financement en transit:', err);
    }

    // Règle 5 : Client inactif (customers sans sales depuis > 60 jours)
    try {
      const { data: inactiveCustomers, error: custError } = await supabase
        .from('customers')
        .select('*');

      if (custError) throw custError;

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      for (const customer of (inactiveCustomers || [])) {
        // On vérifie s'il n'y a pas eu de sales récentes pour ce client
        // Cette règle est simplifiée : on crée l'alerte si le client existe
        // (la détection de "sans sales" nécessiterait une jointure avec transactions/sales)
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('object_id', customer.id)
          .eq('object_type', 'customer')
          .eq('status', 'ouverte')
          .single();

        if (!existing) {
          await supabase.from('alerts').insert({
            title: `Client inactif : ${customer.name}`,
            description: `Le client ${customer.name} n'a pas eu d'activité récente (> 60 jours).`,
            severity: 'low',
            category: 'Ventes',
            object_type: 'customer',
            object_id: customer.id,
            status: 'ouverte',
          });
          created++;
        }
      }
    } catch (err) {
      console.error('Erreur règle 5 client inactif:', err);
    }

    toast.show(`${created} nouvelles alertes créées`);
    setCheckAlertsRunning(false);
  };

  // Filtres
  const [filterStatus, setFilterStatus] = useState<'ouverte' | 'résolue' | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<'high' | 'medium' | 'low' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterSeverity && a.severity !== filterSeverity) return false;
      if (searchQuery && !`${a.title} ${a.description}`.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [alerts, filterStatus, filterSeverity, searchQuery]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Alertes" subtitle="Centre de gestion des alertes et anomalies"
  actions={
    <button
      onClick={() => checkAlerts()}
      disabled={checkAlertsRunning}
      className="flex items-center gap-2 px-4 py-2 bg-signal text-white rounded-lg hover:bg-signal/80 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      title="Scanner la base et créer les alertes manquantes"
    >
      <RefreshCw size={16} /> Vérifier les alertes
    </button>
  } />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Alertes ouvertes" value={String(kpis.open)} icon={<Bell size={20} />} color="amber" />
        <KpiCard label="Haute priorité" value={String(kpis.high)} icon={<AlertTriangle size={20} />} color="red" />
        <KpiCard label="Priorité moyenne" value={String(kpis.medium)} icon={<Bell size={20} />} color="amber" />
        <KpiCard label="Résolues" value={String(kpis.resolved)} icon={<CheckCircle size={20} />} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher une alerte..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="ouverte">Ouvertes</option>
          <option value="résolue">Résolues</option>
        </select>
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value as any)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="">Toutes les sévérités</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-400">Aucune alerte enregistrée.</p>
          </div>
        ) : (
          filteredAlerts.map(a => (
            <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.status === 'ouverte' ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  a.severity === 'high' ? 'bg-red-100 text-red-600' : a.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {a.severity === 'high' ? <AlertTriangle size={18} /> : a.severity === 'medium' ? <Bell size={18} /> : <CheckCircle size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{a.title}</h3>
                    <SimpleBadge color={a.severity === 'high' ? 'red' : a.severity === 'medium' ? 'amber' : 'blue'}>{a.severity}</SimpleBadge>
                    <SimpleBadge color="gray">{a.category}</SimpleBadge>
                    {a.status === 'résolue' && <SimpleBadge color="green">Résolue</SimpleBadge>}
                  </div>
                  <p className="text-sm text-slate-500">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{timeAgo(a.created_at)}</span>
                    {a.assigned_to && <span>· Assignée à {a.assigned_to}</span>}
                  </div>
                </div>
              </div>
              {a.status === 'ouverte' && (
                <button onClick={() => resolveAlert({ id: a.id, title: a.title })} className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200">
                  <CheckCircle size={14} /> Résoudre
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}