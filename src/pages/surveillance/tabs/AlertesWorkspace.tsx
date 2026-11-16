import { useMemo, useState } from 'react';
import { AlertCircle, Archive, CheckCircle, Eye, Pencil, Plus, RotateCcw, Search, UserPlus } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/Toast';
import { timeAgo } from '@/lib/format';
import { Modal } from '@/components/ui/Modal';
import { KpiCard } from '@/components/ui/KpiCard';
import type { Alert, AlertStatus } from '@/lib/types';

type WorkflowStatus = Extract<AlertStatus, 'ouverte' | 'en_cours' | 'en_attente' | 'résolue' | 'annulée' | 'archivée'>;

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  ouverte: 'Ouverte',
  en_cours: 'En cours',
  en_attente: 'En attente',
  résolue: 'Résolue',
  annulée: 'Annulée',
  archivée: 'Archivée',
};

const statusOptions = Object.keys(STATUS_LABELS) as WorkflowStatus[];

function statusClass(status: string) {
  if (status === 'résolue' || status === 'archivée') return 'bg-success/15 text-success';
  if (status === 'en_attente') return 'bg-warning/15 text-warning';
  if (status === 'en_cours') return 'bg-info/15 text-info';
  if (status === 'annulée') return 'bg-surface-hover text-muted';
  return 'bg-danger/15 text-danger';
}

export function AlertesWorkspace() {
  const { alerts, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<WorkflowStatus | ''>('');
  const [severity, setSeverity] = useState('');
  const [selected, setSelected] = useState<Alert | null>(null);
  const [editing, setEditing] = useState<Alert | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [assignee, setAssignee] = useState('');
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({ title: '', description: '', category: 'Générale', severity: 'medium', assigned_to: '' });

  const filtered = useMemo(() => alerts.filter(alert => {
    const text = `${alert.title} ${alert.description || ''} ${alert.category}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (!status || alert.status === status) && (!severity || alert.severity === severity);
  }), [alerts, query, status, severity]);

  const counts = useMemo(() => ({
    open: alerts.filter(a => ['ouverte', 'en_cours', 'en_attente'].includes(a.status)).length,
    high: alerts.filter(a => a.severity === 'high' && !['résolue', 'archivée', 'annulée'].includes(a.status)).length,
    waiting: alerts.filter(a => a.status === 'en_attente').length,
    resolved: alerts.filter(a => ['résolue', 'archivée'].includes(a.status)).length,
  }), [alerts]);

  const writeAlert = async (id: string, patch: Record<string, unknown>, action: string, comment?: string) => {
    setBusy(true);
    try {
      const current = alerts.find(a => a.id === id);
      const nextStatus = String(patch.status || current?.status || 'ouverte');
      const { error } = await supabase.from('alerts').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await supabase.from('alert_actions').insert({
        alert_id: id,
        action,
        from_status: current?.status || null,
        to_status: nextStatus,
        comment: comment || null,
        performed_by: appUser?.id || null,
      });
      toast.show('Alerte mise à jour');
      setSelected(null);
      setEditing(null);
      setResolutionNote('');
      await refresh();
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Impossible de mettre à jour l’alerte', 'error');
    } finally {
      setBusy(false);
    }
  };

  const resolve = () => {
    if (!selected) return;
    if (!resolutionNote.trim()) {
      toast.show('Ajoutez une justification avant de résoudre l’alerte', 'error');
      return;
    }
    void writeAlert(selected.id, {
      status: 'résolue',
      resolved_at: new Date().toISOString(),
      resolved_by: appUser?.id || null,
      resolution_note: resolutionNote.trim(),
    }, 'RESOLVE', resolutionNote.trim());
  };

  const create = async () => {
    if (!newAlert.title.trim()) {
      toast.show('Le titre est obligatoire', 'error');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.from('alerts').insert({
        title: newAlert.title.trim(),
        description: newAlert.description.trim() || null,
        category: newAlert.category.trim() || 'Générale',
        severity: newAlert.severity,
        assigned_to: newAlert.assigned_to.trim() || null,
        status: 'ouverte',
      }).select('id').single();
      if (error) throw error;
      if (data?.id) await supabase.from('alert_actions').insert({ alert_id: data.id, action: 'CREATE', to_status: 'ouverte', performed_by: appUser?.id || null });
      toast.show('Alerte créée');
      setCreateOpen(false);
      setNewAlert({ title: '', description: '', category: 'Générale', severity: 'medium', assigned_to: '' });
      await refresh();
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Impossible de créer l’alerte', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div><h2 className="text-xl font-semibold text-primary">Alertes</h2><p className="text-sm text-muted">Détection, prise en charge et résolution des anomalies</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white"><Plus size={16} /> Nouvelle alerte</button></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="À traiter" value={String(counts.open)} icon={<AlertCircle size={20} />} color="warning" />
        <KpiCard label="Priorité haute" value={String(counts.high)} icon={<AlertCircle size={20} />} color="danger" />
        <KpiCard label="En attente" value={String(counts.waiting)} icon={<UserPlus size={20} />} color="info" />
        <KpiCard label="Résolues" value={String(counts.resolved)} icon={<CheckCircle size={20} />} color="success" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input aria-label="Rechercher une alerte" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une alerte…" className="w-full rounded-lg border border-default bg-surface py-2 pl-9 pr-3 text-sm" /></div>
        <select aria-label="Filtrer par statut" value={status} onChange={e => setStatus(e.target.value as WorkflowStatus | '')} className="rounded-lg border border-default bg-surface px-3 py-2 text-sm"><option value="">Tous les statuts</option>{statusOptions.map(value => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select>
        <select aria-label="Filtrer par sévérité" value={severity} onChange={e => setSeverity(e.target.value)} className="rounded-lg border border-default bg-surface px-3 py-2 text-sm"><option value="">Toutes les sévérités</option><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse</option></select>
      </div>

      <div className="space-y-3">{filtered.length === 0 ? <div className="rounded-xl border border-default p-8 text-center text-muted">Aucune alerte correspondant aux filtres.</div> : filtered.map(alert => <article key={alert.id} className="rounded-xl border border-default bg-surface p-4"><div className="flex items-start gap-3"><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-primary">{alert.title}</h3><span className="rounded-full px-2 py-0.5 text-xs font-medium capitalize">{alert.severity}</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(alert.status)}`}>{STATUS_LABELS[alert.status as WorkflowStatus] || alert.status}</span></div><p className="mt-1 text-sm text-muted">{alert.description || 'Aucune description'}</p><p className="mt-2 text-xs text-muted">{timeAgo(alert.created_at)} · {alert.category}{alert.assigned_to ? ` · Assignée à ${alert.assigned_to}` : ' · Non assignée'}</p></div><div className="flex shrink-0 flex-wrap justify-end gap-2"><button type="button" onClick={() => setSelected(alert)} className="inline-flex items-center gap-1 rounded-lg border border-default px-3 py-1.5 text-xs"><Eye size={14} /> Détail</button>{['ouverte', 'en_cours', 'en_attente'].includes(alert.status) && <button type="button" onClick={() => { setSelected(alert); setResolutionNote(''); }} className="inline-flex items-center gap-1 rounded-lg bg-success/15 px-3 py-1.5 text-xs text-success"><CheckCircle size={14} /> Résoudre</button>}</div></div></article>)}</div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title || 'Détail de l’alerte'} size="lg" footer={selected ? <div className="flex flex-wrap gap-2">{['ouverte', 'en_cours', 'en_attente'].includes(selected.status) && <button type="button" disabled={busy} onClick={resolve} className="rounded-lg bg-success px-3 py-2 text-sm text-white"><CheckCircle size={15} className="inline mr-1" />Résoudre</button>}{selected.status === 'résolue' && <button type="button" disabled={busy} onClick={() => void writeAlert(selected.id, { status: 'ouverte', resolved_at: null, resolved_by: null, resolution_note: null }, 'REOPEN')} className="rounded-lg bg-info px-3 py-2 text-sm text-white"><RotateCcw size={15} className="inline mr-1" />Rouvrir</button>}{!['archivée', 'annulée'].includes(selected.status) && <button type="button" disabled={busy} onClick={() => void writeAlert(selected.id, { status: 'archivée', archived_at: new Date().toISOString() }, 'ARCHIVE')} className="rounded-lg border border-default px-3 py-2 text-sm"><Archive size={15} className="inline mr-1" />Archiver</button>}</div> : undefined}><div className="space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-muted">Statut</span><p className={`mt-1 inline-block rounded-full px-2 py-1 ${statusClass(selected?.status || '')}`}>{STATUS_LABELS[selected?.status as WorkflowStatus] || selected?.status}</p></div><div><span className="text-muted">Sévérité</span><p className="mt-1 font-medium text-primary capitalize">{selected?.severity}</p></div><div><span className="text-muted">Catégorie</span><p className="mt-1 text-primary">{selected?.category}</p></div><div><span className="text-muted">Créée</span><p className="mt-1 text-primary">{selected ? timeAgo(selected.created_at) : ''}</p></div></div><div><span className="text-sm text-muted">Description</span><p className="mt-1 whitespace-pre-wrap text-sm text-primary">{selected?.description || 'Aucune description'}</p></div>{selected?.status !== 'résolue' && selected?.status !== 'archivée' && <div><label className="text-sm text-muted" htmlFor="resolution-note">Note de résolution</label><textarea id="resolution-note" value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} placeholder="Décrire l’action corrective réalisée…" className="mt-1 min-h-24 w-full rounded-lg border border-default bg-surface p-3 text-sm" /></div>}<div className="border-t border-default pt-4"><div className="flex items-center justify-between"><span className="text-sm text-muted">Responsable</span><button type="button" onClick={() => setEditing(selected)} className="text-sm text-accent-primary"><Pencil size={14} className="inline mr-1" />Modifier</button></div><p className="mt-1 text-sm text-primary">{selected?.assigned_to || 'Non assignée'}</p></div></div></Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Modifier l’assignation" footer={<><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-default px-3 py-2 text-sm">Annuler</button><button type="button" disabled={busy || !editing} onClick={() => editing && void writeAlert(editing.id, { assigned_to: assignee.trim() || null }, 'ASSIGN')} className="rounded-lg bg-accent-primary px-3 py-2 text-sm text-white">Enregistrer</button></>}><label className="text-sm text-muted" htmlFor="alert-assignee">Responsable</label><input id="alert-assignee" autoFocus value={assignee || editing?.assigned_to || ''} onChange={e => setAssignee(e.target.value)} placeholder="Nom du responsable" className="mt-1 w-full rounded-lg border border-default bg-surface p-2 text-sm" /></Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouvelle alerte" footer={<><button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-default px-3 py-2 text-sm">Annuler</button><button type="button" disabled={busy} onClick={() => void create()} className="rounded-lg bg-accent-primary px-3 py-2 text-sm text-white">Créer l’alerte</button></>}><div className="space-y-3"><input aria-label="Titre" value={newAlert.title} onChange={e => setNewAlert(v => ({ ...v, title: e.target.value }))} placeholder="Titre de l’alerte" className="w-full rounded-lg border border-default bg-surface p-2 text-sm" /><textarea aria-label="Description" value={newAlert.description} onChange={e => setNewAlert(v => ({ ...v, description: e.target.value }))} placeholder="Description" className="min-h-24 w-full rounded-lg border border-default bg-surface p-2 text-sm" /><div className="grid grid-cols-2 gap-3"><select aria-label="Catégorie" value={newAlert.category} onChange={e => setNewAlert(v => ({ ...v, category: e.target.value }))} className="rounded-lg border border-default bg-surface p-2 text-sm"><option>Générale</option><option>Stocks</option><option>Finance</option><option>Justificatifs</option><option>Chantiers</option><option>Ventes</option></select><select aria-label="Sévérité" value={newAlert.severity} onChange={e => setNewAlert(v => ({ ...v, severity: e.target.value }))} className="rounded-lg border border-default bg-surface p-2 text-sm"><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse</option></select></div><input aria-label="Responsable" value={newAlert.assigned_to} onChange={e => setNewAlert(v => ({ ...v, assigned_to: e.target.value }))} placeholder="Responsable (facultatif)" className="w-full rounded-lg border border-default bg-surface p-2 text-sm" /></div></Modal>
    </div>
  );
}
