import { useState, useRef, useEffect } from 'react';
import { Building2, Coins, Tags, Bell, Shield, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/Toast';
import { logAudit } from '@/lib/types';
import { PageHeader } from '@/components/ui/PageHeader';

export function SettingsPage() {
  const { farm, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'farm' | 'currencies' | 'categories' | 'notifications' | 'security' | 'appearance'>('farm');
  const [saving, setSaving] = useState(false);
  const [farmForm, setFarmForm] = useState({
    name: farm?.name || '',
    location: farm?.location || '',
    phone: farm?.phone || '',
    email: farm?.email || '',
    currency: farm?.currency || 'FCFA',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (farm) {
      setFarmForm({
        name: farm.name || '',
        location: farm.location || '',
        phone: farm.phone || '',
        email: farm.email || '',
        currency: farm.currency || 'FCFA',
      });
    }
  }, [farm]);

  const handleSaveFarm = async () => {
    setSaving(true);
    if (farm) {
      const { error } = await supabase.from('farms').update({
        name: farmForm.name,
        location: farmForm.location,
        phone: farmForm.phone,
        email: farmForm.email,
        currency: farmForm.currency,
        updated_at: new Date().toISOString(),
      }).eq('id', farm.id);
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'farm', farm.id, 'Paramètres de l\'exploitation modifiés');
        toast.show('Paramètres enregistrés');
        refresh();
      }
    }
    setSaving(false);
  };

  const tabs = [
    { id: 'farm' as const, label: 'Exploitation', icon: <Building2 size={18} /> },
    { id: 'currencies' as const, label: 'Devises', icon: <Coins size={18} /> },
    { id: 'categories' as const, label: 'Catégories', icon: <Tags size={18} /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security' as const, label: 'Sécurité', icon: <Shield size={18} /> },
    { id: 'appearance' as const, label: 'Apparence', icon: <ImageIcon size={18} /> },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <PageHeader title="Paramètres" subtitle="Configuration de l'exploitation et de l'application" />

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="sm:w-56 flex-shrink-0">
          <div className="space-y-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {tab === 'farm' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Building2 size={18} /> Informations de l'exploitation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nom de l'exploitation</label>
                    <input type="text" value={farmForm.name} onChange={e => setFarmForm({...farmForm, name: e.target.value})} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Localisation</label>
                    <input type="text" value={farmForm.location} onChange={e => setFarmForm({...farmForm, location: e.target.value})} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
                    <input type="text" value={farmForm.phone} onChange={e => setFarmForm({...farmForm, phone: e.target.value})} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <input type="email" value={farmForm.email} onChange={e => setFarmForm({...farmForm, email: e.target.value})} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Devise principale</label>
                    <select value={farmForm.currency} onChange={e => setFarmForm({...farmForm, currency: e.target.value})} className="form-input">
                      <option value="FCFA">FCFA (Franc CFA)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="USD">USD (Dollar)</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleSaveFarm} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            )}

            {tab === 'currencies' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Coins size={18} /> Devises et taux de change</h3>
                <div className="space-y-2">
                  {[
                    { from: 'EUR', to: 'FCFA', rate: '655.95' },
                    { from: 'USD', to: 'FCFA', rate: '597.00' },
                  ].map(c => (
                    <div key={c.from} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-700">1 {c.from} = {c.rate} {c.to}</span>
                      <span className="text-xs text-slate-400">Taux de référence</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'categories' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Tags size={18} /> Catégories de dépenses</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Alimentation animale', 'Semences', 'Engrais', 'Produits vétérinaires', 'Main-d\'œuvre', 'Matériaux', 'Carburant', 'Transport', 'Équipement', 'Maintenance', 'Construction', 'Administration', 'Autre'].map(c => (
                    <div key={c} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Bell size={18} /> Seuils d'alerte</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Stock minimum atteint', desc: 'Alerte quand stock < minimum' },
                    { label: 'Justificatif manquant', desc: 'Alerte après 7 jours sans justificatif' },
                    { label: 'Dépassement budget', desc: 'Alerte quand > 90% du budget consommé' },
                    { label: 'Projet en retard', desc: 'Alerte quand étape en retard > 15 jours' },
                  ].map(n => (
                    <div key={n.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{n.label}</p>
                        <p className="text-xs text-slate-400">{n.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'security' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Shield size={18} /> Sécurité</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Authentification</p>
                    <p className="text-xs text-slate-400 mt-1">Authentification par email/mot de passe via Supabase Auth</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Row Level Security (RLS)</p>
                    <p className="text-xs text-slate-400 mt-1">Toutes les tables sont protégées par des politiques RLS</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Piste d'audit</p>
                    <p className="text-xs text-slate-400 mt-1">Toutes les actions importantes sont enregistrées dans le journal d'audit</p>
                  </div>
                </div>
              </div>
            )}

            {tab === 'appearance' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><ImageIcon size={18} /> Logo de l'application</h3>
                <p className="text-sm text-slate-500">Le logo apparaît dans la barre latérale, l'en-tête et la page de connexion.</p>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-20 h-20 rounded-xl border-2 border-slate-200 overflow-hidden flex items-center justify-center bg-white flex-shrink-0">
                    {farm?.logo_url ? (
                      <img src={farm.logo_url} alt="Logo actuel" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={28} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file || !farm) return;
                        if (file.size > 2 * 1024 * 1024) {
                          toast.show('Le logo ne doit pas dépasser 2 Mo', 'error');
                          return;
                        }
                        if (!file.type.startsWith('image/')) {
                          toast.show('Le fichier doit être une image', 'error');
                          return;
                        }
                        setUploadingLogo(true);
                        const ext = file.name.split('.').pop() || 'png';
                        const fileName = `logo/logo-${Date.now()}.${ext}`;
                        const { error: upErr } = await supabase.storage.from('app-assets').upload(fileName, file);
                        if (upErr) {
                          toast.show('Erreur upload: ' + upErr.message, 'error');
                          setUploadingLogo(false);
                          return;
                        }
                        const { data: pub } = supabase.storage.from('app-assets').getPublicUrl(fileName);
                        const { error: updErr } = await supabase.from('farms').update({ logo_url: pub.publicUrl, updated_at: new Date().toISOString() }).eq('id', farm.id);
                        if (updErr) {
                          toast.show('Erreur: ' + updErr.message, 'error');
                        } else {
                          await logAudit(appUser?.name || 'Système', 'UPDATE', 'farm', farm.id, 'Logo de l\'application modifié');
                          toast.show('Logo mis à jour avec succès');
                          refresh();
                        }
                        setUploadingLogo(false);
                      }}
                    />
                    <button
                      onClick={() => logoFileRef.current?.click()}
                      disabled={uploadingLogo || !farm}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {uploadingLogo ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={16} />}
                      {uploadingLogo ? 'Upload...' : 'Changer le logo'}
                    </button>
                    {farm?.logo_url && (
                      <button
                        onClick={async () => {
                          if (!farm) return;
                          const { error } = await supabase.from('farms').update({ logo_url: null, updated_at: new Date().toISOString() }).eq('id', farm.id);
                          if (error) {
                            toast.show('Erreur: ' + error.message, 'error');
                          } else {
                            await logAudit(appUser?.name || 'Système', 'UPDATE', 'farm', farm.id, 'Logo supprimé');
                            toast.show('Logo supprimé');
                            refresh();
                          }
                        }}
                        className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Retirer
                      </button>
                    )}
                    <p className="text-xs text-slate-400 mt-2">PNG, JPG — max 2 Mo. L'image est recadrée en carré.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
