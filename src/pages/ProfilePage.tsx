import { useState } from 'react';
import { User, Mail, Phone, Lock, LogOut, Save, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/Toast';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/constants';
import { validatePasswordStrength } from '@/lib/password';
import { PageHeader } from '@/components/ui/PageHeader';

export function ProfilePage() {
  const { appUser, signOut, updatePassword, refreshAppUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(appUser?.name || '');
  const [phone, setPhone] = useState(appUser?.phone || '');
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const handleSaveProfile = async () => {
    if (!appUser) return;
    if (!name.trim()) {
      toast.show('Le nom est requis', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('app_users')
      .update({ name: name.trim(), phone: phone.trim() || null })
      .eq('id', appUser.id);
    setSaving(false);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser.name, 'UPDATE', 'app_users', appUser.id, 'Profil modifié');
      await refreshAppUser();
      toast.show('Profil mis à jour avec succès');
    }
  };

const handleChangePassword = async () => {
    if (!newPassword) {
      toast.show('Veuillez saisir un nouveau mot de passe', 'error');
      return;
    }
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      toast.show(validation.errors.join(' \u2022 '), 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.show('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    setChangingPwd(true);
    const { error } = await updatePassword(newPassword);
    setChangingPwd(false);
    if (error) {
      toast.show('Erreur: ' + error, 'error');
    } else {
      setNewPassword('');
      setConfirmNewPassword('');
      toast.show('Mot de passe modifié avec succès');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!appUser) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <PageHeader title="Mon profil" />
        <p className="text-sm text-muted">Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Mon profil"
        subtitle="Gérez vos informations personnelles et votre sécurité"
      />

      {/* Profile card */}
      <div className="bg-surface rounded-xl border border-default p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {appUser.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-primary">{appUser.name}</h3>
            <p className="text-sm text-muted">{appUser.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-success-soft text-success text-xs font-medium rounded-full border border-default">
              <Shield size={12} /> {ROLE_LABELS[appUser.role] || appUser.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Nom complet</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Adresse email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={appUser.email || ''}
                disabled
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-default rounded-lg bg-surface-hover text-muted cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted mt-1">L'email ne peut pas être modifié</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Téléphone</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+225 07 00 00 00"
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-lg hover:bg-success text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save size={16} /> Enregistrer</>
            )}
          </button>
        </div>
      </div>

      {/* Change password card */}
      <div className="bg-surface rounded-xl border border-default p-6 mb-6">
        <h3 className="font-semibold text-primary mb-1 flex items-center gap-2">
          <Lock size={18} /> Changer le mot de passe
        </h3>
        <p className="text-sm text-muted mb-4">Utilisez un mot de passe d'au moins 8 caractères avec majuscules, minuscules et chiffres.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={changingPwd || !newPassword}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-raised text-white rounded-lg hover:bg-surface text-sm font-medium transition-colors disabled:opacity-50"
          >
            {changingPwd ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Modifier le mot de passe</>
            )}
          </button>
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-surface rounded-xl border border-default p-6">
        <h3 className="font-semibold text-primary mb-1">Déconnexion</h3>
        <p className="text-sm text-muted mb-4">Vous serez déconnecté et redirigé vers la page d'accueil.</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 bg-danger-soft text-danger border border-default rounded-lg hover:bg-danger-soft text-sm font-medium transition-colors"
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
