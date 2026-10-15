import { useMemo, useState } from 'react';
import { Users, Plus, Shield, Mail, Phone, Trash2 } from 'lucide-react';
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

export function UsersPage() {
  const { users, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'gestionnaire', phone: '' });

  const kpis = useMemo(() => {
    const active = users.filter(u => u.active).length;
    const roles = new Set(users.map(u => u.role)).size;
    return { total: users.length, active, roles };
  }, [users]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', role: 'gestionnaire', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email || '', role: u.role, phone: u.phone || '' });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.show('Nom obligatoire', 'error');
      return;
    }
    setSaving(true);
    if (editUser) {
      const { error } = await supabase.from('app_users').update({
        name: form.name, email: form.email || null, role: form.role, phone: form.phone || null,
      }).eq('id', editUser.id);
      if (error) { toast.show('Erreur: ' + error.message, 'error'); }
      else {
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'user', editUser.id, `Utilisateur ${form.name} modifié`);
        toast.show('Utilisateur modifié');
        setModalOpen(false);
        refresh();
      }
    } else {
      const { error } = await supabase.from('app_users').insert({
        name: form.name, email: form.email || null, role: form.role, phone: form.phone || null, active: true,
      });
      if (error) { toast.show('Erreur: ' + error.message, 'error'); }
      else {
        await logAudit(appUser?.name || 'Système', 'CREATE', 'user', null, `Utilisateur ${form.name} créé`);
        toast.show('Utilisateur créé');
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const toggleActive = async (u: AppUser) => {
    const { error } = await supabase.from('app_users').update({ active: !u.active }).eq('id', u.id);
    if (error) { toast.show('Erreur: ' + error.message, 'error'); }
    else {
      await logAudit(appUser?.name || 'Système', 'UPDATE', 'user', u.id, `Utilisateur ${u.name} ${u.active ? 'désactivé' : 'activé'}`);
      toast.show(`Utilisateur ${u.active ? 'désactivé' : 'activé'}`);
      refresh();
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<AppUser | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('app_users').delete().eq('id', confirmDelete.id);
    if (error) { toast.show('Erreur: ' + error.message, 'error'); }
    else {
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
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus size={18} /> Nouvel utilisateur
          </button>
        }
      />

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
              <button onClick={() => openEdit(u)} className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Modifier</button>
              <button onClick={() => toggleActive(u)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                {u.active ? 'Désactiver' : 'Activer'}
              </button>
              {u.id !== appUser?.id && (
                <button onClick={() => setConfirmDelete(u)} className="px-2.5 py-1.5 text-xs border border-red-200 rounded-lg hover:bg-red-50 text-red-600" title="Supprimer">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Shield size={18} /> Rôles et permissions</h3>
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="form-input" placeholder="user@ferme.ci" />
          </div>
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
