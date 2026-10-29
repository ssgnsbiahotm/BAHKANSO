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
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { FormField, FormInput, FormSelect, FormTextarea, FormActions, ConfirmDeleteModal, DetailModal } from '@/components/ui/FormPrimitives';
import * as z from 'zod';

const projectSchema = z.object({
  name: z.string().min(1, 'Le nom du projet est obligatoire'),
  type: z.string().default('infrastructure'),
  responsible: z.string().optional(),
  initial_budget: z.coerce.number().min(0).default(0),
  start_date: z.string().optional(),
  expected_end_date: z.string().optional(),
  status: z.enum(PROJECT_STATUSES).default('planifié'),
  progress: z.coerce.number().min(0).max(100).default(0),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const DEFAULT_VALUES: ProjectFormValues = {
  name: '',
  type: 'infrastructure',
  responsible: '',
  initial_budget: 0,
  start_date: new Date().toISOString().slice(0, 10),
  expected_end_date: '',
  status: 'planifié',
  progress: 0,
  description: '',
};

export function Projects() {
  const { projects, projectSteps, expenses, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

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

  const { values: form, setFieldValue: setForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm({
    schema: projectSchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      const payload = {
        name: values.name.trim(),
        type: values.type,
        responsible: values.responsible || null,
        initial_budget: values.initial_budget,
        revised_budget: values.initial_budget,
        start_date: values.start_date || null,
        expected_end_date: values.expected_end_date || null,
        status: values.status,
        progress: values.progress,
        description: values.description || null,
      };

      if (editProject) {
        const { error } = await supabase.from('projects').update(payload).eq('id', editProject.id);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'project', editProject.id, `Projet "${values.name}" modifié`);
        toast.show('Projet modifié');
      } else {
        const { error } = await supabase.from('projects').insert(payload);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'CREATE', 'project', null, `Projet "${values.name}" créé`);
        toast.show('Projet créé');
      }
      refresh();
    },
    onSuccess: () => { setModalOpen(false); setEditProject(null); },
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editProject,
  });

  const openCreate = () => {
    setEditProject(null);
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setForm('name', p.name);
    setForm('type', p.type || 'infrastructure');
    setForm('responsible', p.responsible || '');
    setForm('initial_budget', p.initial_budget);
    setForm('start_date', p.start_date || new Date().toISOString().slice(0, 10));
    setForm('expected_end_date', p.expected_end_date || '');
    setForm('status', p.status as ProjectFormValues['status']);
    setForm('progress', p.progress);
    setForm('description', p.description || '');
    setDetailProject(null);
    setModalOpen(true);
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

  const getProjectName = (p: Project) => p.name;

  const renderDetailFields = (p: Project) => {
    const steps = projectSteps.filter(s => s.project_id === p.id);
    const spent = expenses.filter(e => e.project_id === p.id && e.status === 'validée').reduce((s, e) => s + e.amount, 0);
    const budget = p.revised_budget || p.initial_budget;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(spent)} <span className="text-sm font-normal text-slate-500">/ {formatCurrency(budget)}</span></p>
            <p className="text-sm text-slate-500">{p.type} · {p.responsible}</p>
          </div>
          <StatusBadge status={p.status} colorMap={PROJECT_STATUS_COLORS} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-slate-400">Budget initial</p><p className="text-sm font-medium">{formatCurrency(p.initial_budget)}</p></div>
          <div><p className="text-xs text-slate-400">Budget révisé</p><p className="text-sm font-medium">{formatCurrency(p.revised_budget)}</p></div>
          <div><p className="text-xs text-slate-400">Date de début</p><p className="text-sm font-medium">{formatDate(p.start_date)}</p></div>
          <div><p className="text-xs text-slate-400">Fin prévue</p><p className="text-sm font-medium">{formatDate(p.expected_end_date)}</p></div>
          <div className="col-span-2"><p className="text-xs text-slate-400">Description</p><p className="text-sm font-medium">{p.description || '—'}</p></div>
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

      <DetailModal
        entity={detailProject}
        onClose={() => setDetailProject(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title="Détails projet"
        size="lg"
        renderFields={renderDetailFields}
      />

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProject(null); }}
        title={editProject ? 'Modifier le projet' : 'Nouveau projet'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <FormField label="Nom du projet" required error={errors.name}>
            <FormInput value={form.name} onChange={e => setForm('name', e.target.value)} placeholder="Construction hangar" />
          </FormField>
          <FormField label="Type" error={errors.type}>
            <FormInput value={form.type} onChange={e => setForm('type', e.target.value)} placeholder="infrastructure" />
          </FormField>
          <FormField label="Responsable" error={errors.responsible}>
            <FormInput value={form.responsible} onChange={e => setForm('responsible', e.target.value)} placeholder={appUser?.name || ''} />
          </FormField>
          <FormField label="Budget initial (FCFA)" error={errors.initial_budget}>
            <FormInput type="number" min="0" value={form.initial_budget} onChange={e => setForm('initial_budget', e.target.value ? parseFloat(e.target.value) : 0)} placeholder="5000000" />
          </FormField>
          <FormField label="Progression (%)" error={errors.progress}>
            <FormInput type="number" min="0" max="100" value={form.progress} onChange={e => setForm('progress', e.target.value ? parseInt(e.target.value) : 0)} />
          </FormField>
          <FormField label="Date de début" error={errors.start_date}>
            <FormInput type="date" value={form.start_date} onChange={e => setForm('start_date', e.target.value)} />
          </FormField>
          <FormField label="Fin prévue" error={errors.expected_end_date}>
            <FormInput type="date" value={form.expected_end_date} onChange={e => setForm('expected_end_date', e.target.value)} />
          </FormField>
          <FormField label="Statut" error={errors.status}>
            <FormSelect value={form.status} onChange={e => setForm('status', e.target.value as ProjectFormValues['status'])}>
              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </FormSelect>
          </FormField>
          <FormField label="Description" error={errors.description}>
            <FormTextarea value={form.description} onChange={e => setForm('description', e.target.value)} rows={2} />
          </FormField>
          <FormActions onSubmit={handleFormSubmit} onCancel={() => { setModalOpen(false); setEditProject(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getProjectName}
      />
    </div>
  );
}