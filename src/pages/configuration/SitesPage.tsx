import { useMemo, useState, useEffect, useRef } from 'react';
import { Users, Plus, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { generateEntityIdentifier } from '@/lib/entity-ids';
import { FormSelect } from '@/components/ui/FormPrimitives';

export interface Site {
  id: string;
  name: string;
  location: string | null;
  area_hectares: number | null;
  responsible: string | null;
  farm_id: string | null;
  code: string | null;
  status: string | null;
}

const SITE_LOCALISATION_SUGGESTIONS = [
  'Katadji, Côte d’Ivoire',
  'Aheremou, Côte d’Ivoire',
  'Braffoueby, Côte d’Ivoire',
  'Abidjan, Côte d’Ivoire',
  'Grand-Bassam, Côte d’Ivoire',
];

const isAdminOrOwner = (role: string | undefined) =>
  role === 'administrateur' || role === 'propriétaire';

export function SitesPage() {
  const { sites, users, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    location: '',
    area_hectares: 0,
    responsableId: null as string | null,
  });
  const formRef = useRef<HTMLFormElement>(null);

  const kpis = useMemo(() => {
    const total = sites.length;
    const actifs = sites.filter(s => s.status !== 'inactif').length;
    const surfaceTotale = sites.reduce((sum, s) => sum + (s.area_hectares || 0), 0);
    return { total, actifs, surfaceTotale };
  }, [sites]);

  const canManageSites = useMemo(() => isAdminOrOwner(appUser?.role), [appUser?.role]);

  const openCreate = async () => {
    if (!canManageSites) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    setEditSite(null);
    const year = new Date().getFullYear();
    const code = await generateEntityIdentifier(`SIT-${year}`, 'sites', 'code', supabase).catch(() => `SIT-${year}-000`);
    setForm({ name: '', code, location: '', area_hectares: 0, responsableId: null });
    setModalOpen(true);
    if (formRef.current) formRef.current.reset();
  };

  const openEdit = (s: Site) => {
    if (!canManageSites) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    setEditSite(s);
    setForm({
      name: s.name,
      code: s.code || '',
      location: s.location || '',
      area_hectares: s.area_hectares || 0,
      responsableId: s.responsible || null,
    });
    setModalOpen(true);
    if (formRef.current) formRef.current.reset();
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.show('Nom obligatoire', 'error');
      return;
    }
    setSaving(true);

    try {
      if (editSite) {
        // MODIFICATION
        const { error } = await supabase.from('sites').update({
          name: form.name,
          code: form.code || null,
          location: form.location || null,
          area_hectares: form.area_hectares || null,
          responsible: form.responsableId || null,
        }).eq('id', editSite.id);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
          setSaving(false);
          return;
        }
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'site', editSite.id, `Site ${form.name} modifié`);
        toast.show('Site modifié');
        setModalOpen(false);
        refresh();
      } else {
        // CRÉATION : le nouveau site est systématiquement actif
        const { error } = await supabase.from('sites').insert({
          name: form.name,
          code: form.code || null,
          location: form.location || null,
          area_hectares: form.area_hectares || 0,
          responsible: form.responsableId || null,
          status: 'actif',
        });
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
          setSaving(false);
          return;
        }
        await logAudit(appUser?.name || 'Système', 'CREATE', 'site', 'new', `Site ${form.name} créé`);
        toast.show('Site créé avec succès');
        setModalOpen(false);
        refresh();
      }
    } catch (err) {
      toast.show('Erreur inattendue: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
      setSaving(false);
    }
  };

  const [confirmSite, setConfirmSite] = useState<Site | null>(null);

const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce site ?')) return;
    if (!canManageSites) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      setConfirmSite(null);
      return;
    }
    if (confirmSite?.id === appUser?.id) {
      toast.show('Vous ne pouvez pas supprimer votre propre entrée', 'error');
      setConfirmSite(null);
      return;
    }
    const { error } = await supabase.from('sites').delete().eq('id', id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
      setConfirmSite(null);
      return;
    }
    await logAudit(appUser?.name || 'Système', 'DELETE', 'site', id, `Site supprimé`);
    toast.show('Site supprimé');
    refresh();
    setConfirmSite(null);
  };

  // Load sites from Supabase if not loaded via DataContext
  useEffect(() => {
    if (!sites || sites.length === 0) {
      ;(async () => {
        const { error } = await supabase.from('sites').select('*');
        if (error) {
          console.error('Error fetching sites:', error);
        } else {
          refresh?.();
        }
      })();
    }
  }, [sites, refresh]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Sites"
        subtitle="Gestion des sites d'exploitation et des parcelles"
        actions={
          <button
            onClick={openCreate}
            disabled={!canManageSites}
            className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canManageSites ? 'Réservé aux administrateurs et propriétaires' : undefined}
          >
            <Plus size={18} /> Nouveau site
          </button>
        }
      />

      {!canManageSites && (
        <div className="mb-6 p-4 bg-warning-soft border border-default rounded-lg text-sm text-warning">
          <MapPin size={16} className="mr-2 mt-0.5" />
          Vous n'avez pas le rôle nécessaire pour créer, modifier ou supprimer des sites.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total sites" value={String(kpis.total)} icon={<Users size={20} />} color="slate" />
        <KpiCard label="Actifs" value={String(kpis.actifs)} icon={<Users size={20} />} color="success" />
        <KpiCard label="Surface totale" value={String(kpis.surfaceTotale)} icon={<MapPin size={20} />} color="info" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map(s => (
          <RotatingCard
            key={s.id}
            flipLabel="Détails"
            backLabel="Retour"
            front={
              <div className="bg-surface rounded-xl border border-default rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-raised rounded-full flex items-center justify-center text-white font-semibold">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">{s.name}</h3>
                      {s.code && <p className="text-xs text-muted">Code: {s.code}</p>}
                    </div>
                  </div>
                  <SimpleBadge color={s.status !== 'inactif' ? 'green' : 'gray'}>${s.status !== 'inactif' ? 'Actif' : 'Inactif'}</SimpleBadge>
                </div>
                <div className="space-y-2 text-sm">
                  {s.location && <div className="flex items-center gap-2 text-secondary"><MapPin size={12} className="text-muted" /> {s.location}</div>}
                  {s.area_hectares && <div className="flex items-center gap-2 text-muted text-xs">Superficie: {String(s.area_hectares)} ha</div>}
                  {s.responsible && <div className="flex items-center gap-2 text-muted text-xs">Responsable: {s.responsible}</div>}
                </div>
              </div>
            }
            back={
              <div className="bg-success-soft border border-default rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-2 text-sm">
                  <h3 className="font-semibold text-primary mb-3">{s.name}</h3>
                  {s.location && <p><span className="text-muted">Localisation :</span> {s.location}</p>}
                  {s.area_hectares && <p><span className="text-muted">Superficie :</span> {String(s.area_hectares)} ha</p>}
                  {s.responsible && <p><span className="text-muted">Responsable :</span> {s.responsible}</p>}
                </div>
                <div className="mt-4 pt-3 border-t border-default flex gap-2">
                  {canManageSites && (
                    <button
                      type="button"
                      onClick={() => { openEdit(s); }} aria-label={`Modifier le site ${s.name}`}
                      className="flex-1 bg-surface text-info border border-default px-3 py-2 rounded-lg text-sm font-medium hover:bg-info-soft flex items-center justify-center gap-1"
                    >
                      <Pencil size={14} /> Modifier
                    </button>
                  )}
                  {canManageSites && (
                    <button
                      type="button"
                      onClick={() => { handleDelete(s.id); }} aria-label={`Supprimer le site ${s.name}`}
                      className="flex-1 bg-danger text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-danger flex items-center justify-center gap-1"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  )}
                </div>
              </div>
            }
          />
        ))}
        {sites.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted">
            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucun site enregistré</p>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSite ? 'Modifier le site' : 'Nouveau site'}
      >
        <form ref={formRef} onSubmit={e => {
          e.preventDefault();
          handleSubmit();
        }}>
          <input
            type="hidden"
            {...editSite && { value: editSite.id } }
          />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Nom *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-primary focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
                placeholder="Nom du site"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Code</label>
              <input
                value={form.code}
                readOnly
                className="w-full border rounded-lg px-3 py-2 text-primary bg-surface-hover focus:ring-0 transition-colors"
                placeholder="Généré automatiquement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Localisation</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                list="site-localisation-suggestions"
                className="w-full border rounded-lg px-3 py-2 text-primary focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
                placeholder="Localisation du site"
              />
              <datalist id="site-localisation-suggestions">
                {SITE_LOCALISATION_SUGGESTIONS.map((suggestion, i) => (
                  <option key={i} value={suggestion} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Superficie (ha)</label>
              <input
                value={form.area_hectares}
                onChange={(e) => setForm({ ...form, area_hectares: Number(e.target.value) || 0 })}
                type="number"
                min="0"
                className="w-full border rounded-lg px-3 py-2 text-primary focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Responsable</label>
              <FormSelect
                value={form.responsableId ?? ''}
                onChange={(e) => setForm({ ...form, responsableId: e.target.value || null })}
              >
                <option value="">— Aucun responsable —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </FormSelect>
              <p className="text-xs text-muted mt-1">
                Utilisateur réel de l’application (app_users)
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              className={editSite ? 'flex-1 bg-warning text-white hover:bg-warning' : 'flex-1 bg-success text-white hover:bg-success'}
            >
              {editSite ? 'Mettre à jour' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 bg-surface-hover text-primary hover:bg-surface-hover"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}