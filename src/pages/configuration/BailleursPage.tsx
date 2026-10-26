import { useMemo, useState, useEffect } from 'react';
import { Users, Plus, Shield, Mail, Phone, Trash2, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
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

export function BailleursPage() {
  const { funders, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editFunder, setEditFunder] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    country: '',
    user_id: '',
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [usersFinanceur, setUsersFinanceur] = useState<any[]>([]);

  const kpis = useMemo(() => {
    const total = funders.length;
    const active = funders.filter(f => f.active !== false).length;
    const totalSent = funders.reduce((sum, f) => sum + (f.total_sent || 0), 0);
    const totalReceived = funders.reduce((sum, f) => sum + (f.total_received || 0), 0);
    return { total, active, totalSent, totalReceived };
  }, [funders]);

  const canManageFunders = useMemo(() => isAdminOrOwner(appUser?.role), [appUser?.role]);

  const openCreate = () => {
    if (!canManageFunders) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    setEditFunder(null);
    setForm({ name: '', organization: '', email: '', phone: '', country: '', user_id: '' });
    setModalOpen(true);
    if (formRef.current) formRef.current.reset();
  };

  const openEdit = (f: any) => {
    if (!canManageFunders) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    setEditFunder(f);
    setForm({ name: f.name, organization: f.organization || '', email: f.email || '', phone: f.phone || '', country: f.country || '', user_id: '' });
    setModalOpen(true);
    if (formRef.current) formRef.current.reset();
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.show('Nom obligatoire', 'error');
      return;
    }
    if (!form.email) {
      toast.show('Email obligatoire', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.show('Format d\'email invalide', 'error');
      return;
    }

    setSaving(true);

    try {
      if (editFunder) {
        // MODIFICATION
        const { error } = await supabase.from('funders').update({
          name: form.name,
          organization: form.organization || null,
          email: form.email || null,
          phone: form.phone || null,
          country: form.country || null,
          user_id: form.user_id || null,
        }).eq('id', editFunder.id);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
          setSaving(false);
          return;
        }
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'funder', editFunder.id, `Bailleur ${form.name} modifié`);
        toast.show('Bailleur modifié');
        setModalOpen(false);
        refresh();
      } else {
        // CRÉATION
        const { error } = await supabase.from('funders').insert({
          name: form.name,
          organization: form.organization || null,
          email: form.email || null,
          phone: form.phone || null,
          country: form.country || null,
          user_id: form.user_id || null,
          total_sent: 0,
          total_received: 0,
        });
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
          setSaving(false);
          return;
        }
        await logAudit(appUser?.name || 'Système', 'CREATE', 'funder', 'new', `Bailleur ${form.name} créé`);
        toast.show('Bailleur créé avec succès');
        setModalOpen(false);
        refresh();
      }
    } catch (err: any) {
      toast.show('Erreur inattendue: ' + (err.message || 'Unknown error'), 'error');
      setSaving(false);
    }
  };

  const toggleActive = async (f: any) => {
    if (!canManageFunders) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    if (f.id === appUser?.id) {
      toast.show('Vous ne pouvez pas modifier votre propre entrée', 'error');
      return;
    }
    const { error } = await supabase.from('funders').update({ active: !f.active }).eq('id', f.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'funder', f.id, `Bailleur ${f.name} ${f.active ? 'désactivé' : 'activé'}`);
      toast.show(`Bailleur ${f.active ? 'désactivé' : 'activé'}`);
      refresh();
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (!canManageFunders) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      setConfirmDelete(null);
      return;
    }
    if (confirmDelete.id === appUser?.id) {
      toast.show('Vous ne pouvez pas supprimer votre propre entrée', 'error');
      setConfirmDelete(null);
      return;
    }
    const { error } = await supabase.from('funders').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'funder', confirmDelete.id, `Bailleur ${confirmDelete.name} supprimé`);
      toast.show('Bailleur supprimé');
      setConfirmDelete(null);
      refresh();
    }
  };

  // Load funders from Supabase if not loaded via DataContext
  useEffect(() => {
    if (!funders || funders.length === 0) {
      // Try to fetch funders directly
      ;(async () => {
        const { data, error } = await supabase.from('funders').select('*');
        if (error) {
          console.error('Error fetching funders:', error);
        } else {
          refresh?.();
        }
      })();
    }
  }, [funders, refresh]);

  // Fetch users with role financeur for linking
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.from('app_users').select('*').eq('role', 'financeur');
      if (error) {
        console.error('Error fetching finance users:', error);
      } else {
        setUsersFinanceur(data || []);
      }
    })();
  }, []);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Bailleurs de fonds"
        subtitle="Gestion des bailleurs de fonds et suivi des contributions"
        actions={
          <button
            onClick={openCreate}
            disabled={!canManageFunders}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canManageFunders ? 'Réservé aux administrateurs et propriétaires' : undefined}
          >
            <Plus size={18} /> Nouveau bailleur
          </button>
        }
      />

      {!canManageFunders && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertCircle size={16} className="mr-2 mt-0.5" />
          Vous n\'avez pas le rôle nécessaire pour créer, modifier ou supprimer des bailleurs de fonds.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total bailleurs" value={String(kpis.total)} icon={<Users size={20} />} color="dark" />
        <KpiCard label="Actifs" value={String(kpis.active)} icon={<Users size={20} />} color="green" />
        <KpiCard label="Total envoyé" value={String(kpis.totalSent)} icon={<Mail size={20} />} color="blue" />
        <KpiCard label="Total reçu" value={String(kpis.totalReceived)} icon={<Mail size={20} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {funders.map(f => (
          <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {f.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{f.name}</h3>
                  {f.organization && <p className="text-xs text-slate-500">{f.organization}</p>}
                </div>
              </div>
              <SimpleBadge color={f.active !== false ? 'green' : 'gray'}>${f.active !== false ? 'Actif' : 'Inactif'}</SimpleBadge>
            </div>
            <div className="space-y-2 text-sm">
              {f.email && <div className="flex items-center gap-2 text-slate-600"><Mail size={14} className="text-slate-400" /> {f.email}</div>}
              {f.phone && <div className="flex items-center gap-2 text-slate-600"><Phone size={14} className="text-slate-400" /> {f.phone}</div>}
              {f.country && <div className="flex items-center gap-2 text-slate-500 text-xs">Pays: {f.country}</div>}
              {f.total_sent > 0 && <div className="flex items-center gap-2 text-slate-500 text-xs">Total envoyé: {String(f.total_sent)}</div>}
              {f.total_received > 0 && <div className="flex items-center gap-2 text-slate-500 text-xs">Total reçu: {String(f.total_received)}</div>}
              <div className="flex items-center gap-2 text-slate-500 text-xs">Créé le {formatDate(f.created_at)}</div>
              {f.user_id && <span className="text-sm text-green-600 font-medium">Compte lié</span>}
            </div>
            <div className="mt-3 flex gap-2">
              {canManageFunders && (
                <button
                  onClick={() => openEdit(f)}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                  title="Modifier"
                >
                  Modifier
                </button>
              )}
              {canManageFunders && (
                <button
                  onClick={() => setConfirmDelete(f)}
                  className="text-red-600 hover:text-red-800 text-sm underline"
                  title="Supprimer"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
        {funders.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500">
            <AlertCircle size={48} className="mb-3 opacity-50" />
            <p>Aucun bailleur de fonds enregistré</p>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editFunder ? 'Modifier le bailleur' : 'Nouveau bailleur'}
      >
        <form ref={formRef} onSubmit={e => {
          e.preventDefault();
          handleSubmit();
        }}>
          <input
            type="hidden"
            {...editFunder && { value: editFunder.id } }
          />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
                placeholder="Nom du bailleur"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organisation</label>
              <input
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
                placeholder="Organisation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                required
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Pays</label>
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
                placeholder="Côte d'Ivoire"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Compte utilisateur lié</label>
              <select
                value={form.user_id || ''}
                onChange={(e) => setForm({ ...form, user_id: e.target.value || '' })}
                className="w-full border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-signal focus:border-signal transition-colors"
              >
                <option value="">Aucune</option>
                {usersFinanceur.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email || ''})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              className={editFunder ? 'flex-1 bg-yellow-600 text-white hover:bg-yellow-700' : 'flex-1 bg-green-600 text-white hover:bg-green-700'}
            >
              {editFunder ? 'Mettre à jour' : 'Créer'}
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