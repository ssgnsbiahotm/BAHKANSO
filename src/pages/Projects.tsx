import { useMemo, useState } from 'react';
import '@/styles/theme-app.css';
import { HardHat, Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit, type Project } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  PROJECT_STATUS_COLORS, PROJECT_STATUSES,
  STATUS_CLASS_SUCCESS, STATUS_CLASS_WARNING, STATUS_CLASS_DANGER,
} from '@/lib/constants';
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
  const [flippedProjects, setFlippedProjects] = useState<Set<string>>(
    () => new Set()
  );

  const toggleProjectCard = (projectId: string) => {
    setFlippedProjects(current => {
      const next = new Set(current);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

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
        <div className="flex items-center justify-between p-4 bg-surface-hover rounded-lg">
          <div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(spent)} <span className="text-sm font-normal text-muted">/ {formatCurrency(budget)}</span></p>
            <p className="text-sm text-muted">{p.type} · {p.responsible}</p>
          </div>
          <StatusBadge status={p.status} colorMap={PROJECT_STATUS_COLORS} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-muted">Budget initial</p><p className="text-sm font-medium">{formatCurrency(p.initial_budget)}</p></div>
          <div><p className="text-xs text-muted">Budget révisé</p><p className="text-sm font-medium">{formatCurrency(p.revised_budget)}</p></div>
          <div><p className="text-xs text-muted">Date de début</p><p className="text-sm font-medium">{formatDate(p.start_date)}</p></div>
          <div><p className="text-xs text-muted">Fin prévue</p><p className="text-sm font-medium">{formatDate(p.expected_end_date)}</p></div>
          <div className="col-span-2"><p className="text-xs text-muted">Description</p><p className="text-sm font-medium">{p.description || '—'}</p></div>
        </div>
        <div>
          <h4 className="font-semibold text-primary mb-2">Étapes du projet</h4>
          <div className="space-y-2">
            {steps.length === 0 ? (
              <p className="text-sm text-muted py-2 text-center">Aucune étape définie</p>
            ) : steps.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-surface-hover rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${s.progress === 100 ? STATUS_CLASS_SUCCESS : s.progress > 0 ? STATUS_CLASS_WARNING : 'bg-surface-hover text-muted'}`}>
                  {s.progress}%
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">{s.name}</p>
                  <p className="text-xs text-muted">{formatCurrency(s.actual_cost)} / {formatCurrency(s.budget)}</p>
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
    <div className="module-page">
      <header className="module-header">
        <div className="module-header-left">
          <h1 style={{ color: 'var(--color-ivory)' }}>Projets &amp; Chantiers</h1>
          <p className="module-subtitle">
            Suivi des investissements et projets de l'exploitation
          </p>
        </div>
        <div className="module-header-right">
          <button onClick={openCreate} className="module-btn module-btn-primary">
            <Plus size={18} /> Nouveau projet
          </button>
        </div>
      </header>

      <div className="module-kpi-grid">
        <div className="module-kpi-card" style={{ borderLeftColor: 'var(--mdn-grass)' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
              <HardHat size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Budget total</p>
            <div className="module-kpi-value" style={{ color: 'var(--accent-primary)' }}>
              {formatCurrency(kpis.totalBudget)}
            </div>
          </div>
        </div>

        <div className="module-kpi-card" style={{ borderLeftColor: 'var(--mdn-terre)' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'var(--mdn-terre-soft)', color: 'var(--mdn-terre)' }}>
              <HardHat size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Total dépensé</p>
            <div className="module-kpi-value" style={{ color: 'var(--mdn-terre)' }}>
              {formatCurrency(kpis.totalSpent)}
            </div>
          </div>
        </div>

        <div className="module-kpi-card" style={{ borderLeftColor: 'var(--mdn-sky)' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(143,211,244,0.16)', color: 'var(--mdn-sky)' }}>
              <HardHat size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">En cours</p>
            <div className="module-kpi-value" style={{ color: 'var(--mdn-sky)' }}>
              {kpis.ongoing}
            </div>
          </div>
        </div>

        <div className="module-kpi-card" style={{ borderLeftColor: 'var(--mdn-slate)' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'var(--mdn-bg-surface-hover)', color: 'var(--mdn-slate)' }}>
              <HardHat size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Terminés</p>
            <div className="module-kpi-value" style={{ color: 'var(--mdn-encre)' }}>
              {kpis.completed}
            </div>
          </div>
        </div>
      </div>

      <div className="module-tabs" role="group" aria-label="Filtrer les projets">
        {['all', 'ongoing', 'completed'].map(f => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`module-tab ${filter === f ? 'active' : ''}`}
          >
            {f === 'all' ? 'Tous' : f === 'ongoing' ? 'En cours' : 'Terminés'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<HardHat size={48} />}
          title={projects.length === 0 ? "Aucun projet" : "Aucun résultat"}
          message={projects.length === 0 ? "Créez votre premier projet" : "Aucun projet dans cette catégorie"}
          action={projects.length === 0 ? <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success text-sm font-medium"><Plus size={16} /> Créer un projet</button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(p => {
            const spent = expenses
              .filter(e => e.project_id === p.id && e.status === 'validée')
              .reduce((s, e) => s + e.amount, 0);
            const budget = p.revised_budget || p.initial_budget;
            const isFlipped = flippedProjects.has(p.id);
            const remaining = budget - spent;

            const faceStyle: React.CSSProperties = {
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              borderRadius: 16,
              padding: 20,
              border: '1px solid var(--mdn-border, #e5e7eb)',
              background: '#fff',
            };

            return (
              <div
                key={p.id}
                style={{ perspective: 1200, minHeight: 310 }}
              >
                <div
                  style={{
                    position: 'relative',
                    minHeight: 310,
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    WebkitTransformStyle: 'preserve-3d',
                    transition: 'transform 650ms cubic-bezier(.2,.75,.25,1)',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* RECTO : informations du projet */}
                  <section
                    aria-label={`Résumé du projet ${p.name}`}
                    style={{
                      ...faceStyle,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                          <HardHat size={22} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-primary truncate">{p.name}</h3>
                          <p className="text-xs text-muted mt-1">
                            {p.type} · {p.responsible || 'Responsable non défini'}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={p.status} colorMap={PROJECT_STATUS_COLORS} />
                    </div>

                    <div className="mb-5">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted">Progression du projet</span>
                        <span className="font-semibold text-primary">{p.progress}%</span>
                      </div>
                      <ProgressBar value={p.progress} color="green" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 py-4 border-y border-default">
                      <div className="min-w-0">
                        <span className="text-xs text-muted">Budget</span>
                        <p className="font-semibold text-primary text-sm mt-1 break-words">
                          {formatCurrency(budget)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-muted">Dépensé</span>
                        <p className="font-semibold text-sm mt-1 break-words" style={{ color: 'var(--mdn-terre)' }}>
                          {formatCurrency(spent)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-muted">Disponible</span>
                        <p className="font-semibold text-sm mt-1 break-words" style={{ color: 'var(--accent-primary)' }}>
                          {formatCurrency(remaining)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-auto pt-4">
                      <div className="flex items-center gap-2 text-xs text-muted min-w-0">
                        <Calendar size={14} />
                        <span className="truncate">
                          {formatDate(p.start_date)} → {formatDate(p.expected_end_date)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleProjectCard(p.id)}
                        className="module-btn module-btn-primary shrink-0"
                        aria-label={`Afficher les actions du projet ${p.name}`}
                        aria-expanded={isFlipped}
                      >
                        Actions <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  </section>

                  {/* VERSO : actions CRUD */}
                  <section
                    aria-label={`Actions du projet ${p.name}`}
                    style={{
                      ...faceStyle,
                      transform: 'rotateY(180deg)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: 'var(--mdn-bg-surface, #fff)',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Gestion du projet
                        </span>
                        <span className="text-xs text-muted">#{p.id.slice(0, 8)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-primary">{p.name}</h3>
                      <p className="text-sm text-muted mt-1">
                        Choisissez une action à effectuer sur ce projet.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailProject(p);
                          toggleProjectCard(p.id);
                        }}
                        className="flex items-center gap-3 w-full rounded-xl border border-default p-3 text-left hover:bg-surface-hover transition-colors"
                      >
                        <span className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--info-soft)', color: 'var(--info)' }}>
                          <HardHat size={18} />
                        </span>
                        <span>
                          <strong className="block text-sm text-primary">Consulter</strong>
                          <span className="text-xs text-muted">Voir les détails et les étapes</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toggleProjectCard(p.id);
                          openEdit(p);
                        }}
                        className="flex items-center gap-3 w-full rounded-xl border border-default p-3 text-left hover:bg-surface-hover transition-colors"
                      >
                        <span className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                          <Pencil size={18} />
                        </span>
                        <span>
                          <strong className="block text-sm text-primary">Modifier</strong>
                          <span className="text-xs text-muted">Mettre à jour le projet</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toggleProjectCard(p.id);
                          setConfirmDelete(p);
                        }}
                        className={`flex items-center gap-3 w-full rounded-xl border border-default p-3 text-left transition-colors ${STATUS_CLASS_DANGER}`}
                      >
                        <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${STATUS_CLASS_DANGER}`}>
                          <Trash2 size={18} />
                        </span>
                        <span>
                          <strong className={`block text-sm ${STATUS_CLASS_DANGER.split(' ')[1]}`}>Supprimer</strong>
                          <span className="text-xs text-muted">Supprimer après confirmation</span>
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleProjectCard(p.id)}
                      className="w-full text-center text-sm font-medium text-secondary py-2 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      ← Retour à la carte
                    </button>
                  </section>
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