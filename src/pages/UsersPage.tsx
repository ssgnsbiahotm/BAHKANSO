import { useMemo, useState, useEffect } from 'react';
import { Users, Plus, Shield, Mail, Phone, Trash2, Lock, AlertCircle } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit, type AppUser } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatDate } from '@/lib/format';
import { ROLES, ROLE_LABELS } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

const isAdminOrOwner = (role: string | undefined) =>
  role === 'administrateur' || role === 'propriétaire';

const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

export function UsersPage() {
  const { users, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'gestionnaire',
    phone: '',
  });

  const kpis = useMemo(() => {
    const active = users.filter(u => u.active).length;
    const roles = new Set(users.map(u => u.role)).size;
    return { total: users.length, active, roles };
  }, [users]);

  const canManageUsers = useMemo(() => isAdminOrOwner(appUser?.role), [appUser?.role]);

  const openCreate = () => {
    if (!canManageUsers) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    setEditUser(null);
    setForm({ name: '', email: '', password: '', confirmPassword: '', role: 'gestionnaire', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (u: AppUser) => {
    if (!canManageUsers) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    setEditUser(u);
    setForm({ name: u.name, email: u.email || '', password: '', confirmPassword: '', role: u.role, phone: u.phone || '' });
    setModalOpen(true);
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
    if (!validateEmail(form.email)) {
      toast.show('Format d\'email invalide', 'error');
      return;
    }

    setSaving(true);

    if (editUser) {
      // MODIFICATION : mise à jour de app_users uniquement (pas de changement de mot de passe ici)
      const { error } = await supabase.from('app_users').update({
        name: form.name,
        email: form.email || null,
        role: form.role,
        phone: form.phone || null,
      }).eq('id', editUser.id);
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
        setSaving(false);
        return;
      }
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'user', editUser.id, `Utilisateur ${form.name} modifié`);
      toast.show('Utilisateur modifié');
      setModalOpen(false);
      refresh();
    } else {
      // CRÉATION : créer d'abord le compte Supabase Auth, puis la ligne app_users
      if (!form.password) {
        toast.show('Mot de passe obligatoire', 'error');
        setSaving(false);
        return;
      }
      if (form.password.length < 8) {
        toast.show('Le mot de passe doit faire au moins 8 caractères', 'error');
        setSaving(false);
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.show('Les mots de passe ne correspondent pas', 'error');
        setSaving(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name, role: form.role } },
      });

      if (error) {
        if (error.message.includes('already')) {
          toast.show('Un compte existe déjà avec cet email', 'error');
        } else {
          toast.show('Erreur: ' + error.message, 'error');
        }
        setSaving(false);
        return;
      }

      if (data.user) {
        // Le trigger handle_new_user() a créé la ligne app_users avec role='gestionnaire' par défaut.
        // On met à jour avec le rôle et le téléphone choisis.
        try {
          await supabase.from('app_users')
            .update({ role: form.role, phone: form.phone || null })
            .eq('auth_id', data.user.id);
        } catch {
          // Ignore si RLS bloque (email non confirmé) — l'admin corrigera plus tard
        }

        const emailConfirmed = !!data.user.email_confirmed_at;
        if (!emailConfirmed) {
          toast.show('Compte créé. L\'utilisateur doit confirmer son email avant de se connecter.', 'info');
        } else {
          toast.show('Utilisateur créé avec succès');
        }
        await logAudit(appUser?.name || 'Système', 'CREATE', 'user', data.user.id, `Utilisateur ${form.name} créé`);
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const toggleActive = async (u: AppUser) => {
    if (!canManageUsers) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      return;
    }
    if (u.id === appUser?.id) {
      toast.show('Vous ne pouvez pas désactiver votre propre compte', 'error');
      return;
    }
    const { error } = await supabase.from('app_users').update({ active: !u.active }).eq('id', u.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'user', u.id, `Utilisateur ${u.name} ${u.active ? 'désactivé' : 'activé'}`);
      toast.show(`Utilisateur ${u.active ? 'désactivé' : 'activé'}`);
      refresh();
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<AppUser | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (!canManageUsers) {
      toast.show('Accès réservé aux administrateurs et propriétaires', 'error');
      setConfirmDelete(null);
      return;
    }
    if (confirmDelete.id === appUser?.id) {
      toast.show('Vous ne pouvez pas supprimer votre propre compte', 'error');
      setConfirmDelete(null);
      return;
    }
    const { error } = await supabase.from('app_users').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'user', confirmDelete.id, `Utilisateur ${confirmDelete.name} supprimé`);
      toast.show('Utilisateur supprimé');
      setConfirmDelete(null);
      refresh();
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des utilisateurs et rôles"
        actions={
          <button
            onClick={openCreate}
            disabled={!canManageUsers}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canManageUsers ? 'Réservé aux administrateurs et propriétaires' : undefined}
          >
            <Plus size={18} /> Nouvel utilisateur
          </button>
        }
      />

      {!canManageUsers && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertCircle size={16} className="mr-2 mt-0.5" />
          Vous n\'avez pas le rôle nécessaire pour créer, modifier ou supprimer des utilisateurs.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total utilisateurs" value={String(kpis.total)} icon={<Users size={20} />} color="dark" />
        <KpiCard label="Actifs" value={String(kpis.active)} icon={<Users size={20} />} color="green" />
        <KpiCard label="Rôles distincts" value={String(kpis.roles)} icon={<Shield size={20} />} color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{u.name}</h3>
                  <p className="text-xs text-slate-500">{ROLE_LABELS[u.role] || u.role}</p>
                </div>
              </div>
              <SimpleBadge color={u.active ? 'green' : 'gray'}>{u.active ? 'Actif' : 'Inactif'}</SimpleBadge>
            </div>
            <div className="space-y-2 text-sm">
              {u.email && <div className="flex items-center gap-2 text-slate-600"><Mail size={14} className="text-slate-400" /> {u.email}</div>}
              {u.phone && <div className="flex items-center gap-2 text-slate-600"><Phone size={14} className="text-slate-400" /> {u.phone}</div>}
              <div className="flex items-center gap-2 text-slate-500 text-xs">Créé le {formatDate(u.created_at)}</div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => openEdit(u)}
                disabled={!canManageUsers}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Modifier
              </button>
              <button
                onClick={() => toggleActive(u)}
                disabled={!canManageUsers || u.id === appUser?.id}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title={u.id === appUser?.id ? 'Impossible de se désactiver soi-même' : undefined}
              >
                {u.active ? 'Désactiver' : 'Activer'}
              </button>
              {u.id !== appUser?.id && canManageUsers && (
                <button
                  onClick={() => setConfirmDelete(u)}
                  className="px-2.5 py-1.5 text-xs border border-red-200 rounded-lg hover:bg-red-50 text-red-600" title="Supprimer"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Shield size={18} /> Rôles et permissions</h3>
        <p className="text-xs text-slate-500 mb-3">
          Seuls les rôles <strong>Administrateur</strong> et <strong>Propriétaire / Direction</strong> peuvent gérer les utilisateurs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ROLES.map(r => (
            <div key={r.value} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-medium text-slate-700">{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : editUser ? 'Modifier' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom complet *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="form-input" placeholder="Kouadio Mensah" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="form-input" placeholder="user@ferme.ci" />
          </div>
          {!editUser && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe *</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="form-input" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Confirmer le mot de passe *</label>
                <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="form-input" placeholder="••••••••" />
                <p className="text-xs text-slate-400 mt-1">Minimum 8 caractères</p>
              </div>
            </>
          )}
          {editUser && (
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
              <Lock size={14} className="mr-1 mt-0.5" />
              Le mot de passe ne peut pas être modifié ici. Utilisez « Mot de passe oublié » sur la page de connexion.
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Rôle</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="form-input">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
            <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="form-input" placeholder="+225 07 00 00 00 00" />
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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer l'utilisateur « {confirmDelete?.name} » ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}
