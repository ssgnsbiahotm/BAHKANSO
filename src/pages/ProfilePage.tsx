import { useState } from 'react';
import { User, Mail, Phone, Lock, LogOut, Save, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/Toast';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS } from '@/lib/constants';
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
      const revalidation = await refreshAppUser();
      if (revalidation.error) {
        toast.show('Profil enregistré, mais la revalidation de l’habilitation a échoué', 'warning');
        return;
      }
      toast.show('Profil mis à jour avec succès');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.show('Veuillez saisir un nouveau mot de passe', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast.show('Le mot de passe doit faire au moins 8 caractères', 'error');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.show('Le mot de passe doit contenir majuscules, minuscules et chiffres', 'error');
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
        <p className="text-sm text-slate-500">Chargement du profil...</p>
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {appUser.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900">{appUser.name}</h3>
            <p className="text-sm text-slate-500">{appUser.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              <Shield size={12} /> {ROLE_LABELS[appUser.role] || appUser.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom complet</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Adresse email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={appUser.email || ''}
                disabled
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">L'email ne peut pas être modifié</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Téléphone</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+225 07 00 00 00"
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50"
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Lock size={18} /> Changer le mot de passe
        </h3>
        <p className="text-sm text-slate-500 mb-4">Utilisez un mot de passe d'au moins 8 caractères avec majuscules, minuscules et chiffres.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={changingPwd || !newPassword}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm font-medium transition-colors disabled:opacity-50"
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
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-1">Déconnexion</h3>
        <p className="text-sm text-slate-500 mb-4">Vous serez déconnecté et redirigé vers la page d'accueil.</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
