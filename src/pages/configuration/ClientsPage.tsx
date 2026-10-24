import { useMemo, useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, UserX, Mail, Phone, MapPin, Settings, AlertCircle, CheckCircle, Loader2, Plus } from 'lucide-react';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatDate } from '@/lib/format';
import { ROLES, ROLE_LABELS } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useRef } from 'react';

const isAdminOrOwner = (role: string | undefined) =>
  role === 'administrateur' || role === 'propriétaire';

export function ClientsPage() {
  const { sites, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'particulier',
    email: '',
    phone: '',
    site_id: '',
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [typesOptions, setTypesOptions] = useState<string[]>(['particulier', 'restaurant', 'marché', 'exportateur', 'autre']);
  const [clients, setClients] = useState<any[]>([]);
  const [sitesOptions, setSitesOptions] = useState<any[]>([]);

  const canManageClients = useMemo(() => isAdminOrOwner(appUser?.role), [appUser?.role]);

  // Load clients from Supabase if not loaded
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) {
        console.error('Error fetching clients:', error);
      } else {
        setClients(data || []);
        refresh?.();
      }
    })();
  }, []);

  // Load types options
  useEffect(() => {
    setTypesOptions(['particulier', 'restaurant', 'marché', 'exportateur', 'autre']);
  }, []);

  // Load sites for the select
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.from('sites').select('*');
      if (error) {
        console.error('Error fetching sites:', error);
      } else {
        setSitesOptions(data || []);
      }
    })();
  }, []);

  const kpis = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.active !== false).length;
    return { total, active };
  }, [clients]);

  const openCreate = () => {
    if (!canManageClients) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    setEditClient(null);
    setForm({ name: '', type: 'particulier', email: '', phone: '', site_id: '' });
    setModalOpen(true);
    if (formRef.current) formRef.current.reset();
  };

  const openEdit = (c: any) => {
    if (!canManageClients) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    setEditClient(c);
    setForm({ name: c.name, type: c.type || 'particulier', email: c.email || '', phone: c.phone || '', site_id: c.site_id || '' });
    setModalOpen(true);
    if (formRef.current) formRef.current.reset();
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.show('Nom obligatoire', 'error');
      return;
    }
    if (!form.email && !form.phone) {
      toast.show('Email ou téléphone obligatoire', 'error');
      return;
    }

    setSaving(true);

    try {
      if (editClient) {
        // MODIFICATION
        const { error } = await supabase
          .from('customers')
          .update({
            name: form.name,
            type: form.type || null,
            email: form.email || null,
            phone: form.phone || null,
            site_id: form.site_id || null,
          })
          .eq('id', editClient.id);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
          setSaving(false);
          return;
        }
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'customer', editClient.id, `Client ${form.name} modifié`);
        toast.show('Client modifié');
        setModalOpen(false);
        refresh();
      } else {
        // CRÉATION
        const { error } = await supabase
          .from('customers')
          .insert({
            name: form.name,
            type: form.type || 'particulier',
            email: form.email || null,
            phone: form.phone || null,
            site_id: form.site_id || null,
            total_purchases: 0,
            created_by: appUser?.id || null,
          });
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
          setSaving(false);
          return;
        }
        await logAudit(appUser?.name || 'Système', 'CREATE', 'customer', 'new', `Client ${form.name} créé`);
        toast.show('Client créé avec succès');
        setModalOpen(false);
        refresh();
      }
    } catch (err: any) {
      toast.show('Erreur inattendue: ' + (err.message || 'Unknown error'), 'error');
      setSaving(false);
    }
  };

  const toggleActive = async (c: any) => {
    if (!canManageClients) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    if (c.id === appUser?.id) {
      toast.show('Vous ne pouvez pas modifier votre propre entrée', 'error');
      return;
    }
    const { error } = await supabase
      .from('customers')
      .update({ active: !c.active })
      .eq('id', c.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'customer', c.id, `Client ${c.name} ${c.active ? 'désactivé' : 'activé'}`);
      toast.show(`Client ${c.active ? 'désactivé' : 'activé'}`);
      refresh();
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

  const handleDelete = async (id: string) => {
    setConfirmDelete(id);
    if (!confirmDelete) return;
    if (!canManageClients) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      setConfirmDelete(null);
      return;
    }
    if (confirmDelete.id === appUser?.id) {
      toast.show('Vous ne pouvez pas supprimer votre propre entrée', 'error');
      setConfirmDelete(null);
      return;
    }
    const { error } = await supabase.from('customers').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'customer', confirmDelete.id, `Client ${confirmDelete.name} supprimé`);
      toast.show('Client supprimé');
      setConfirmDelete(null);
      refresh();
    }
  };

  // Load client types
  useEffect(() => {
    setTypesOptions(['particulier', 'restaurant', 'marché', 'exportateur', 'autre']);
  }, []);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Clients"
        subtitle="Gestion des clients et suivi des achats"
        actions={
          <button
            onClick={openCreate}
            disabled={!canManageClients}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canManageClients ? 'Réservé aux administrateurs et propriétaires' : undefined}
          >
            <Plus size={18} /> Nouveau client
          </button>
        }
      />

      {!canManageClients && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertCircle size={16} className="mr-2 mt-0.5" />
          Vous n'avez pas le rôle nécessaire pour créer, modifier ou supprimer des clients.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total clients" value={String(kpis.total)} icon={<Users size={20} />} color="dark" />
        <KpiCard label="Actifs" value={String(kpis.active)} icon={<Users size={20} />} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(c => (
          <RotatingCard
            key={c.id}
            flipLabel="Détails"
            backLabel="Retour"
            front={
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                      {c.type}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  {c.email && <p>📧 {c.email}</p>}
                  {c.phone && <p>📞 {c.phone}</p>}
                  {c.site_id && <p>📍 {sitesOptions.find(s => s.id === c.site_id)?.name || '—'}</p>}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button className="w-full text-sm text-emerald-700 font-medium hover:text-emerald-800">
                    Voir les détails →
                  </button>
                </div>
              </div>
            }
            back={
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">{c.name}</h3>
                  <dl className="space-y-2 text-sm">
                    <div><dt className="text-slate-500 text-xs">Type</dt><dd className="font-medium">{c.type}</dd></div>
                    <div><dt className="text-slate-500 text-xs">Email</dt><dd>{c.email || '—'}</dd></div>
                    <div><dt className="text-slate-500 text-xs">Téléphone</dt><dd>{c.phone || '—'}</dd></div>
                    <div><dt className="text-slate-500 text-xs">Site</dt><dd>{sitesOptions.find(s => s.id === c.site_id)?.name || '—'}</dd></div>
                  </dl>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-200 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                    className="flex-1 bg-white text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            } />
        ))}
        {clients.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500">
            <AlertCircle size={48} className="mb-3 opacity-50" />
            <p>Aucun client enregistré</p>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editClient ? 'Modifier le client' : 'Nouveau client'}
      >
        <form ref={formRef} onSubmit={e => {
          e.preventDefault();
          handleSubmit();
        }}>
          <input
            type="hidden"
            {...editClient && { value: editClient.id } }
          />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
                placeholder="Nom du client"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
              >
                <option value="particulier">Particulier</option>
                <option value="restaurant">Restaurant</option>
                <option value="marché">Marché</option>
                <option value="exportateur">Exportateur</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                className="w-full border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
                placeholder="contact@exemple.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
                placeholder="+225 XX XX XX XX"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Site lié</label>
              <select
                value={form.site_id || ''}
                onChange={(e) => setForm({ ...form, site_id: e.target.value || '' })}
                className="w-full border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
              >
                <option value="">Aucun</option>
                {sitesOptions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code || ''})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              className={editClient ? 'flex-1 bg-yellow-600 text-white hover:bg-yellow-700' : 'flex-1 bg-green-600 text-white hover:bg-green-700'}
            >
              {editClient ? 'Mettre à jour' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 bg-slate-300 text-slate-900 hover:bg-slate-400"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}