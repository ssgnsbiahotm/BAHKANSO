import { useMemo, useState } from 'react';
import { HardHat, Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit, type Project } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { PROJECT_STATUS_COLORS, PROJECT_STATUSES } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

function emptyForm() {
  return {
    name: '',
    type: 'infrastructure',
    responsible: '',
    initial_budget: '',
    start_date: new Date().toISOString().slice(0, 10),
    expected_end_date: '',
    status: 'planifié',
    progress: '0',
    description: '',
  };
}

export function Projects() {
  const { projects, projectSteps, expenses, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    if (filter === 'all') return projects;
    if (filter === 'ongoing') return projects.filter(p => p.status === 'en cours');
    if (filter === 'completed') return projects.filter(p => p.status === 'terminé');
    return projects;
  }, [projects, filter]);

  const kpis = useMemo(() => {
    const totalBudget = projects.reduce((s, p) => s + (p.revised_budget || p.initial_budget), 0);
    const totalSpent = projects.reduce((s, p) => {
      return s + expenses.filter(e => e.project_id === p.id && e.status === 'validée').reduce((se, e) => se + e.amount, 0);
    }, 0);
    const ongoing = projects.filter(p => p.status === 'en cours').length;
    const completed = projects.filter(p => p.status === 'terminé').length;
    return { totalBudget, totalSpent, ongoing, completed };
  }, [projects, expenses]);

  const openCreate = () => {
    setEditProject(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setForm({
      name: p.name,
      type: p.type || 'infrastructure',
      responsible: p.responsible || '',
      initial_budget: String(p.initial_budget),
      start_date: p.start_date || new Date().toISOString().slice(0, 10),
      expected_end_date: p.expected_end_date || '',
      status: p.status,
      progress: String(p.progress),
      description: p.description || '',
    });
    setDetailProject(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.show('Le nom du projet est obligatoire', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      responsible: form.responsible || null,
      initial_budget: parseFloat(form.initial_budget) || 0,
      revised_budget: parseFloat(form.initial_budget) || 0,
      start_date: form.start_date || null,
      expected_end_date: form.expected_end_date || null,
      status: form.status,
      progress: parseInt(form.progress) || 0,
      description: form.description || null,
    };
    if (editProject) {
      const { error } = await supabase.from('projects').update(payload).eq('id', editProject.id);
      if (error) { toast.show('Erreur: ' + error.message, 'error'); }
      else {
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'project', editProject.id, `Projet "${form.name}" modifié`);
        toast.show('Projet modifié');
        setModalOpen(false);
        refresh();
      }
    } else {
      const { error } = await supabase.from('projects').insert(payload);
      if (error) { toast.show('Erreur: ' + error.message, 'error'); }
      else {
        await logAudit(appUser?.name || 'Système', 'CREATE', 'project', null, `Projet "${form.name}" créé`);
        toast.show('Projet créé');
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('projects').delete().eq('id', confirmDelete.id);
    if (error) { toast.show('Erreur: ' + error.message, 'error'); }
    else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'project', confirmDelete.id, `Projet "${confirmDelete.name}" supprimé`);
      toast.show('Projet supprimé');
      setConfirmDelete(null);
      setDetailProject(null);
      refresh();
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Projets & Chantiers"
        subtitle="Suivi des investissements et projets de l'exploitation"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus size={18} /> Nouveau projet
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Budget total" value={formatCurrency(kpis.totalBudget)} icon={<HardHat size={20} />} color="blue" />
        <KpiCard label="Total dépensé" value={formatCurrency(kpis.totalSpent)} icon={<HardHat size={20} />} color="amber" />
        <KpiCard label="En cours" value={String(kpis.ongoing)} icon={<HardHat size={20} />} color="green" />
        <KpiCard label="Terminés" value={String(kpis.completed)} icon={<HardHat size={20} />} color="dark" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'ongoing', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${filter === f ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f === 'all' ? 'Tous' : f === 'ongoing' ? 'En cours' : 'Terminés'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<HardHat size={48} />}
          title={projects.length === 0 ? "Aucun projet" : "Aucun résultat"}
          message={projects.length === 0 ? "Créez votre premier projet" : "Aucun projet dans cette catégorie"}
          action={projects.length === 0 ? <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"><Plus size={16} /> Créer un projet</button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(p => {
            const spent = expenses.filter(e => e.project_id === p.id && e.status === 'validée').reduce((s, e) => s + e.amount, 0);
            const budget = p.revised_budget || p.initial_budget;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailProject(p)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><HardHat size={20} /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-500">{p.type} · {p.responsible}</p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} colorMap={PROJECT_STATUS_COLORS} />
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-500">Progression</span>
                    <span className="font-medium text-slate-900">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} color="green" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><span className="text-slate-500 text-xs">Budget</span><p className="font-medium">{formatCurrency(budget)}</p></div>
                  <div><span className="text-slate-500 text-xs">Dépensé</span><p className="font-medium text-amber-600">{formatCurrency(spent)}</p></div>
                  <div><span className="text-slate-500 text-xs">Reste</span><p className="font-medium text-green-600">{formatCurrency(budget - spent)}</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar size={12} />
                    {formatDate(p.start_date)} → {formatDate(p.expected_end_date)}
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Modifier"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDelete(p)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Supprimer"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!detailProject && !confirmDelete && !modalOpen}
        onClose={() => setDetailProject(null)}
        title={detailProject?.name || ''}
        size="lg"
        footer={
          detailProject ? (
            <>
              <button onClick={() => setConfirmDelete(detailProject)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => openEdit(detailProject)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
            </>
          ) : undefined
        }
      >
        {detailProject && (() => {
          const steps = projectSteps.filter(s => s.project_id === detailProject.id);
          const spent = expenses.filter(e => e.project_id === detailProject.id && e.status === 'validée').reduce((s, e) => s + e.amount, 0);
          const budget = detailProject.revised_budget || detailProject.initial_budget;
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(spent)} <span className="text-sm font-normal text-slate-500">/ {formatCurrency(budget)}</span></p>
                  <p className="text-sm text-slate-500">{detailProject.type} · {detailProject.responsible}</p>
                </div>
                <StatusBadge status={detailProject.status} colorMap={PROJECT_STATUS_COLORS} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-400">Budget initial</p><p className="text-sm font-medium">{formatCurrency(detailProject.initial_budget)}</p></div>
                <div><p className="text-xs text-slate-400">Budget révisé</p><p className="text-sm font-medium">{formatCurrency(detailProject.revised_budget)}</p></div>
                <div><p className="text-xs text-slate-400">Date de début</p><p className="text-sm font-medium">{formatDate(detailProject.start_date)}</p></div>
                <div><p className="text-xs text-slate-400">Fin prévue</p><p className="text-sm font-medium">{formatDate(detailProject.expected_end_date)}</p></div>
                <div className="col-span-2"><p className="text-xs text-slate-400">Description</p><p className="text-sm font-medium">{detailProject.description || '—'}</p></div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Étapes du projet</h4>
                <div className="space-y-2">
                  {steps.length === 0 ? (
                    <p className="text-sm text-slate-400 py-2 text-center">Aucune étape définie</p>
                  ) : steps.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${s.progress === 100 ? 'bg-green-500 text-white' : s.progress > 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {s.progress}%
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(s.actual_cost)} / {formatCurrency(s.budget)}</p>
                      </div>
                      <StatusBadge status={s.status} colorMap={PROJECT_STATUS_COLORS} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProject ? 'Modifier le projet' : 'Nouveau projet'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : editProject ? 'Modifier' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom du projet *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="form-input" placeholder="Construction hangar" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <input type="text" value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="form-input" placeholder="infrastructure" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Responsable</label>
            <input type="text" value={form.responsible} onChange={e => setForm({...form, responsible: e.target.value})} className="form-input" placeholder={appUser?.name || ''} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Budget initial (FCFA)</label>
            <input type="number" value={form.initial_budget} onChange={e => setForm({...form, initial_budget: e.target.value})} className="form-input" placeholder="5000000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Progression (%)</label>
            <input type="number" min="0" max="100" value={form.progress} onChange={e => setForm({...form, progress: e.target.value})} className="form-input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date de début</label>
            <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="form-input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fin prévue</label>
            <input type="date" value={form.expected_end_date} onChange={e => setForm({...form, expected_end_date: e.target.value})} className="form-input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="form-input">
              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="form-input" rows={2} />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirmer la suppression"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer le projet « {confirmDelete?.name} » ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}
