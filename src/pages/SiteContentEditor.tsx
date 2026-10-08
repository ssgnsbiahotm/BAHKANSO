import { useState } from 'react';
import { Save, RotateCcw, Eye, Image as ImageIcon, Plus, X } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Logo, getIcon } from '@/components/ui/Logo';

const ICON_CHOICES = [
  'Sprout', 'Wallet', 'FileText', 'HardHat', 'Package', 'Beef', 'Shield',
  'TrendingUp', 'Check', 'BarChart3', 'ScrollText', 'Bell', 'Users',
  'Landmark', 'Receipt', 'Truck', 'FileBarChart', 'LayoutDashboard',
  'Settings', 'AlertTriangle', 'Eye', 'Lock', 'Mail', 'ArrowRight',
  'PiggyBank', 'Clock', 'Plus', 'Menu', 'X',
];

const COLOR_CHOICES = [
  '#16A34A', '#15803D', '#22C55E', '#2563EB', '#1D4ED8', '#F59E0B',
  '#DC2626', '#7C3AED', '#0891B2', '#EA580C', '#0F172A', '#FFFFFF',
];

type SectionKey = 'branding' | 'hero' | 'heroCard' | 'stats' | 'features' | 'featuresSection' | 'workflow' | 'roles' | 'cta' | 'footer' | 'login';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'branding', label: 'Identité & Logo' },
  { key: 'hero', label: 'Section Hero' },
  { key: 'heroCard', label: 'Carte Hero' },
  { key: 'stats', label: 'Statistiques' },
  { key: 'features', label: 'Fonctionnalités' },
  { key: 'featuresSection', label: 'Titre Fonctionnalités' },
  { key: 'workflow', label: 'Processus' },
  { key: 'roles', label: 'Rôles' },
  { key: 'cta', label: 'Section CTA' },
  { key: 'footer', label: 'Pied de page' },
  { key: 'login', label: 'Page de connexion' },
];

export function SiteContentEditor() {
  const { siteContent, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [section, setSection] = useState<SectionKey>('branding');
  const [drafts, setDrafts] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const getContent = (key: string): Record<string, unknown> => {
    if (drafts[key]) return drafts[key] as Record<string, unknown>;
    const sc = siteContent[key];
    return (sc?.value as Record<string, unknown>) || {};
  };

  const getListContent = (key: string): unknown[] => {
    if (drafts[key]) return drafts[key] as unknown[];
    const sc = siteContent[key];
    return (sc?.value as unknown[]) || [];
  };

  const updateField = (key: string, field: string, value: unknown) => {
    const current = getContent(key);
    setDrafts({ ...drafts, [key]: { ...current, [field]: value } });
  };

  const updateListItem = (key: string, index: number, field: string, value: unknown) => {
    const list = [...(getListContent(key) as Record<string, unknown>[])];
    list[index] = { ...list[index], [field]: value };
    setDrafts({ ...drafts, [key]: list });
  };

  const addListItem = (key: string, template: Record<string, unknown>) => {
    const list = [...(getListContent(key) as Record<string, unknown>[]), template];
    setDrafts({ ...drafts, [key]: list });
  };

  const removeListItem = (key: string, index: number) => {
    const list = (getListContent(key) as Record<string, unknown>[]).filter((_, i) => i !== index);
    setDrafts({ ...drafts, [key]: list });
  };

  const updateListItemString = (key: string, index: number, value: string) => {
    const list = [...(getListContent(key) as string[])];
    list[index] = value;
    setDrafts({ ...drafts, [key]: list });
  };

  const addStringItem = (key: string) => {
    const list = [...(getListContent(key) as string[]), 'Nouvel élément'];
    setDrafts({ ...drafts, [key]: list });
  };

  const handleSave = async () => {
    setSaving(true);
    const keys = Object.keys(drafts);
    for (const key of keys) {
      const { error } = await supabase.from('site_content')
        .update({ value: drafts[key], updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
        setSaving(false);
        return;
      }
    }
    await logAudit(appUser?.name || 'Système', 'UPDATE', 'site_content', null, `Contenu du site modifié (${keys.join(', ')})`);
    toast.show('Contenu enregistré avec succès');
    setDrafts({});
    refresh();
    setSaving(false);
  };

  const handleReset = () => {
    setDrafts({});
    toast.show('Modifications annulées', 'info');
  };

  const hasDrafts = Object.keys(drafts).length > 0;

  const branding = getContent('branding') as Record<string, string>;
  const hero = getContent('hero') as Record<string, unknown>;
  const heroCard = getContent('heroCard') as Record<string, unknown>;
  const stats = getListContent('stats') as Record<string, string>[];
  const features = getListContent('features') as Record<string, string>[];
  const featuresSection = getContent('featuresSection') as Record<string, string>;
  const workflow = getContent('workflow') as Record<string, unknown>;
  const rolesContent = getContent('roles') as Record<string, unknown>;
  const cta = getContent('cta') as Record<string, string>;
  const footer = getContent('footer') as Record<string, unknown>;
  const login = getContent('login') as Record<string, unknown>;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Contenu du site"
        subtitle="Éditez tous les textes, le logo et les images du site vitrine"
        actions={
          <>
            {hasDrafts && (
              <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <RotateCcw size={16} /> Annuler
              </button>
            )}
            <button onClick={handleSave} disabled={!hasDrafts || saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Section tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="space-y-1 lg:sticky lg:top-20">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  section === s.key ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.label}
                {drafts[s.key] !== undefined && <span className="w-2 h-2 rounded-full bg-amber-400 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {section === 'branding' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2"><ImageIcon size={18} /> Identité & Logo</h3>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <Logo
                    icon={branding.logoIcon || 'Sprout'}
                    color={branding.logoColor || '#FFFFFF'}
                    bgColor={branding.logoBgColor || '#16A34A'}
                    size={56}
                  />
                  <div>
                    <p className="font-bold text-lg text-slate-900">{branding.appName || 'Bahkanso'}</p>
                    <p className="text-xs text-slate-500">{branding.appTagline || ''}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Icône du logo</label>
                  <div className="grid grid-cols-8 gap-2">
                    {ICON_CHOICES.map(ic => {
                      const IcComp = getIcon(ic);
                      return (
                        <button
                          key={ic}
                          onClick={() => updateField('branding', 'logoIcon', ic)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-colors ${
                            (branding.logoIcon || 'Sprout') === ic ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <IcComp size={18} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">Couleur de l'icône</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_CHOICES.map(c => (
                        <button key={c} onClick={() => updateField('branding', 'logoColor', c)}
                          className={`w-8 h-8 rounded-lg border-2 ${(branding.logoColor || '#FFFFFF') === c ? 'border-slate-900' : 'border-slate-200'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                      <input type="color" value={branding.logoColor || '#FFFFFF'} onChange={e => updateField('branding', 'logoColor', e.target.value)} className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">Couleur de fond du logo</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_CHOICES.map(c => (
                        <button key={c} onClick={() => updateField('branding', 'logoBgColor', c)}
                          className={`w-8 h-8 rounded-lg border-2 ${(branding.logoBgColor || '#16A34A') === c ? 'border-slate-900' : 'border-slate-200'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                      <input type="color" value={branding.logoBgColor || '#16A34A'} onChange={e => updateField('branding', 'logoBgColor', e.target.value)} className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer" />
                    </div>
                  </div>
                </div>
                <FormField label="Nom de l'application" value={branding.appName || ''} onChange={v => updateField('branding', 'appName', v)} />
                <FormField label="Slogan" value={branding.appTagline || ''} onChange={v => updateField('branding', 'appTagline', v)} />
                <FormField label="Texte pied de page (sidebar)" value={branding.footerText || ''} onChange={v => updateField('branding', 'footerText', v)} />
                <FormField label="Sous-texte pied de page (sidebar)" value={branding.footerSubtext || ''} onChange={v => updateField('branding', 'footerSubtext', v)} />
              </div>
            )}

            {section === 'hero' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Section Hero</h3>
                <FormField label="Badge" value={String(hero.badge || '')} onChange={v => updateField('hero', 'badge', v)} />
                <FormField label="Titre principal" value={String(hero.title || '')} onChange={v => updateField('hero', 'title', v)} />
                <FormField label="Mot mis en évidence" value={String(hero.highlight || '')} onChange={v => updateField('hero', 'highlight', v)} />
                <TextAreaField label="Sous-titre" value={String(hero.subtitle || '')} onChange={v => updateField('hero', 'subtitle', v)} rows={3} />
                <FormField label="Bouton principal" value={String(hero.ctaPrimary || '')} onChange={v => updateField('hero', 'ctaPrimary', v)} />
                <FormField label="Bouton secondaire" value={String(hero.ctaSecondary || '')} onChange={v => updateField('hero', 'ctaSecondary', v)} />
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Badges de confiance</label>
                  <div className="space-y-2">
                    {((hero.trustBadges as string[]) || []).map((badge, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="text" value={badge} onChange={e => { const arr = [...((hero.trustBadges as string[]) || [])]; arr[i] = e.target.value; updateField('hero', 'trustBadges', arr); }} className="form-input" />
                        <button onClick={() => { const arr = ((hero.trustBadges as string[]) || []).filter((_, idx) => idx !== i); updateField('hero', 'trustBadges', arr); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><X size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => updateField('hero', 'trustBadges', [...((hero.trustBadges as string[]) || []), 'Nouveau badge'])} className="flex items-center gap-1 text-sm text-green-600 hover:underline"><Plus size={14} /> Ajouter</button>
                  </div>
                </div>
              </div>
            )}

            {section === 'heroCard' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Carte Hero (aperçu dashboard)</h3>
                <FormField label="Libellé" value={String(heroCard.label || '')} onChange={v => updateField('heroCard', 'label', v)} />
                <FormField label="Valeur" value={String(heroCard.value || '')} onChange={v => updateField('heroCard', 'value', v)} />
                <FormField label="Tendance" value={String(heroCard.trend || '')} onChange={v => updateField('heroCard', 'trend', v)} />
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Statistiques (3 colonnes)</label>
                  {((heroCard.items as Record<string, string>[]) || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input type="text" placeholder="Libellé" value={item.label || ''} onChange={e => { const arr = [...((heroCard.items as Record<string, string>[]) || [])]; arr[i] = { ...arr[i], label: e.target.value }; updateField('heroCard', 'items', arr); }} className="form-input" />
                      <input type="text" placeholder="Valeur" value={item.value || ''} onChange={e => { const arr = [...((heroCard.items as Record<string, string>[]) || [])]; arr[i] = { ...arr[i], value: e.target.value }; updateField('heroCard', 'items', arr); }} className="form-input w-24" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Lignes affichées</label>
                  {((heroCard.lines as Record<string, string>[]) || []).map((line, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input type="text" placeholder="Texte" value={line.text || ''} onChange={e => { const arr = [...((heroCard.lines as Record<string, string>[]) || [])]; arr[i] = { ...arr[i], text: e.target.value }; updateField('heroCard', 'lines', arr); }} className="form-input" />
                      <input type="text" placeholder="Valeur" value={line.value || ''} onChange={e => { const arr = [...((heroCard.lines as Record<string, string>[]) || [])]; arr[i] = { ...arr[i], value: e.target.value }; updateField('heroCard', 'lines', arr); }} className="form-input w-32" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === 'stats' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Statistiques</h3>
                {stats.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <input type="text" placeholder="Valeur" value={s.value || ''} onChange={e => updateListItem('stats', i, 'value', e.target.value)} className="form-input w-28" />
                    <input type="text" placeholder="Libellé" value={s.label || ''} onChange={e => updateListItem('stats', i, 'label', e.target.value)} className="form-input" />
                    <button onClick={() => removeListItem('stats', i)} className="text-red-500 hover:bg-red-50 p-2 rounded"><X size={16} /></button>
                  </div>
                ))}
                <button onClick={() => addListItem('stats', { value: '0', label: 'Nouveau' })} className="flex items-center gap-1 text-sm text-green-600 hover:underline"><Plus size={14} /> Ajouter une statistique</button>
              </div>
            )}

            {section === 'features' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Fonctionnalités</h3>
                {features.map((f, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Fonctionnalité {i + 1}</span>
                      <button onClick={() => removeListItem('features', i)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><X size={14} /></button>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Icône</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {ICON_CHOICES.map(ic => {
                          const IcComp = getIcon(ic);
                          return (
                            <button key={ic} onClick={() => updateListItem('features', i, 'icon', ic)}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 ${(f.icon || '') === ic ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-200 text-slate-400'}`}>
                              <IcComp size={16} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <input type="text" placeholder="Titre" value={f.title || ''} onChange={e => updateListItem('features', i, 'title', e.target.value)} className="form-input" />
                    <textarea placeholder="Description" value={f.desc || ''} onChange={e => updateListItem('features', i, 'desc', e.target.value)} className="form-input" rows={2} />
                  </div>
                ))}
                <button onClick={() => addListItem('features', { icon: 'Sprout', title: 'Nouvelle fonctionnalité', desc: 'Description' })} className="flex items-center gap-1 text-sm text-green-600 hover:underline"><Plus size={14} /> Ajouter</button>
              </div>
            )}

            {section === 'featuresSection' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Titre section fonctionnalités</h3>
                <FormField label="Titre" value={featuresSection.title || ''} onChange={v => updateField('featuresSection', 'title', v)} />
                <TextAreaField label="Sous-titre" value={featuresSection.subtitle || ''} onChange={v => updateField('featuresSection', 'subtitle', v)} rows={2} />
              </div>
            )}

            {section === 'workflow' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Processus / Chaîne de traçabilité</h3>
                <FormField label="Titre" value={String(workflow.title || '')} onChange={v => updateField('workflow', 'title', v)} />
                <TextAreaField label="Sous-titre" value={String(workflow.subtitle || '')} onChange={v => updateField('workflow', 'subtitle', v)} rows={2} />
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Étapes</label>
                  {((workflow.steps as Record<string, string>[]) || []).map((step, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded-lg">
                      <select value={step.icon || ''} onChange={e => { const arr = [...((workflow.steps as Record<string, string>[]) || [])]; arr[i] = { ...arr[i], icon: e.target.value }; updateField('workflow', 'steps', arr); }} className="form-input w-32">
                        {ICON_CHOICES.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                      <input type="text" placeholder="Libellé" value={step.label || ''} onChange={e => { const arr = [...((workflow.steps as Record<string, string>[]) || [])]; arr[i] = { ...arr[i], label: e.target.value }; updateField('workflow', 'steps', arr); }} className="form-input" />
                      <button onClick={() => { const arr = ((workflow.steps as Record<string, string>[]) || []).filter((_, idx) => idx !== i); updateField('workflow', 'steps', arr); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><X size={16} /></button>
                    </div>
                  ))}
                  <button onClick={() => updateField('workflow', 'steps', [...((workflow.steps as Record<string, string>[]) || []), { icon: 'Check', label: 'Nouvelle étape' }])} className="flex items-center gap-1 text-sm text-green-600 hover:underline"><Plus size={14} /> Ajouter une étape</button>
                </div>
              </div>
            )}

            {section === 'roles' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Section Rôles</h3>
                <FormField label="Titre" value={String(rolesContent.title || '')} onChange={v => updateField('roles', 'title', v)} />
                <TextAreaField label="Sous-titre" value={String(rolesContent.subtitle || '')} onChange={v => updateField('roles', 'subtitle', v)} rows={2} />
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Liste des rôles</label>
                  {((rolesContent.list as string[]) || []).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input type="text" value={r} onChange={e => updateListItemString('roles', i, e.target.value)} className="form-input" />
                      <button onClick={() => { const arr = ((rolesContent.list as string[]) || []).filter((_, idx) => idx !== i); updateField('roles', 'list', arr); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><X size={16} /></button>
                    </div>
                  ))}
                  <button onClick={() => addStringItem('roles')} className="flex items-center gap-1 text-sm text-green-600 hover:underline"><Plus size={14} /> Ajouter</button>
                </div>
              </div>
            )}

            {section === 'cta' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Section CTA (Call to Action)</h3>
                <FormField label="Titre" value={cta.title || ''} onChange={v => updateField('cta', 'title', v)} />
                <TextAreaField label="Sous-titre" value={cta.subtitle || ''} onChange={v => updateField('cta', 'subtitle', v)} rows={2} />
                <FormField label="Bouton principal" value={cta.primary || ''} onChange={v => updateField('cta', 'primary', v)} />
                <FormField label="Bouton secondaire" value={cta.secondary || ''} onChange={v => updateField('cta', 'secondary', v)} />
              </div>
            )}

            {section === 'footer' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Pied de page</h3>
                <TextAreaField label="Description" value={String(footer.description || '')} onChange={v => updateField('footer', 'description', v)} rows={3} />
                <FormField label="Titre modules" value={String(footer.modulesTitle || '')} onChange={v => updateField('footer', 'modulesTitle', v)} />
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Liste modules</label>
                  {((footer.modules as string[]) || []).map((m, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input type="text" value={m} onChange={e => { const arr = [...((footer.modules as string[]) || [])]; arr[i] = e.target.value; updateField('footer', 'modules', arr); }} className="form-input" />
                      <button onClick={() => { const arr = ((footer.modules as string[]) || []).filter((_, idx) => idx !== i); updateField('footer', 'modules', arr); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <FormField label="Titre sécurité" value={String(footer.securityTitle || '')} onChange={v => updateField('footer', 'securityTitle', v)} />
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Éléments sécurité</label>
                  {((footer.security as Record<string, string>[]) || []).map((sec, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded-lg">
                      <select value={sec.icon || ''} onChange={e => { const arr = [...((footer.security as Record<string, string>[]) || [])]; arr[i] = { ...arr[i], icon: e.target.value }; updateField('footer', 'security', arr); }} className="form-input w-32">
                        {ICON_CHOICES.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                      <input type="text" value={sec.text || ''} onChange={e => { const arr = [...((footer.security as Record<string, string>[]) || [])]; arr[i] = { ...arr[i], text: e.target.value }; updateField('footer', 'security', arr); }} className="form-input" />
                      <button onClick={() => { const arr = ((footer.security as Record<string, string>[]) || []).filter((_, idx) => idx !== i); updateField('footer', 'security', arr); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <FormField label="Copyright" value={String(footer.copyright || '')} onChange={v => updateField('footer', 'copyright', v)} />
              </div>
            )}

            {section === 'login' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Page de connexion</h3>
                <FormField label="Titre" value={String(login.title || '')} onChange={v => updateField('login', 'title', v)} />
                <TextAreaField label="Sous-titre" value={String(login.subtitle || '')} onChange={v => updateField('login', 'subtitle', v)} rows={3} />
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Avantages</label>
                  {((login.benefits as string[]) || []).map((b, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input type="text" value={b} onChange={e => { const arr = [...((login.benefits as string[]) || [])]; arr[i] = e.target.value; updateField('login', 'benefits', arr); }} className="form-input" />
                      <button onClick={() => { const arr = ((login.benefits as string[]) || []).filter((_, idx) => idx !== i); updateField('login', 'benefits', arr); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><X size={16} /></button>
                    </div>
                  ))}
                  <button onClick={() => updateField('login', 'benefits', [...((login.benefits as string[]) || []), 'Nouvel avantage'])} className="flex items-center gap-1 text-sm text-green-600 hover:underline"><Plus size={14} /> Ajouter</button>
                </div>
                <TextAreaField label="Citation" value={String(login.quote || '')} onChange={v => updateField('login', 'quote', v)} rows={2} />
                <FormField label="Auteur de la citation" value={String(login.quoteAuthor || '')} onChange={v => updateField('login', 'quoteAuthor', v)} />
              </div>
            )}
          </div>

          {hasDrafts && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
              <Eye size={16} /> Vous avez des modifications non enregistrées. Cliquez sur « Enregistrer » pour les publier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="form-input" />
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} className="form-input" rows={rows} />
    </div>
  );
}
