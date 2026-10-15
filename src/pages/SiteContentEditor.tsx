import { useState } from 'react';
import { Save, RotateCcw, Eye, Image as ImageIcon, Plus, X, Trash, ArrowUp, ArrowDown, FileText } from 'lucide-react';
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
  // État de l'onglet actuellement sélectionné
  const [section, setSection] = useState<SectionKey>('branding');
  // État des modifications en cours (côté client uniquement, pas de brouillon serveur)
  const [drafts, setDrafts] = useState<Record<string, unknown>>({});
  // État de sauvegarde/publication en cours
  const [saving, setSaving] = useState(false);
  // État indiquant si on est en mode aperçu (visualisation des modifications sans enregistrement)
  const [previewMode, setPreviewMode] = useState(false);

  // États pour la gestion des fonctionnalités
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [editFeatureTitle, setEditFeatureTitle] = useState<string>('');
  const [editFeatureIcon, setEditFeatureIcon] = useState<string>('Sprout');
  const [editFeatureDesc, setEditFeatureDesc] = useState<string>('');

  const [isAddingFeature, setIsAddingFeature] = useState<boolean>(false);
  const [newFeatureTitle, setNewFeatureTitle] = useState<string>('');
  const [newFeatureIcon, setNewFeatureIcon] = useState<string>('Sprout');
  const [newFeatureDesc, setNewFeatureDesc] = useState<string>('');
  const [newFeatureTitleError, setNewFeatureTitleError] = useState<string | null>(null);

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

  // Fonction de validation pour les champs essentiels
  // Ces champs sont considérés comme essentiels car leur vide causerait un affichage clairement défectueux
  const validateEssentialFields = (): { isValid: boolean; error: string | null } => {
    // Validation du nom de l'application (champ essentiel de la section branding)
    const branding = getContent('branding') as Record<string, string>;
    if (!branding.appName || String(branding.appName).trim() === '') {
      return {
        isValid: false,
        error: 'Le nom de l\'application est obligatoire'
      };
    }

    // Validation du titre principal (champ essentiel de la section hero)
    const hero = getContent('hero') as Record<string, unknown>;
    if (!hero.title || String(hero.title).trim() === '') {
      return {
        isValid: false,
        error: 'Le titre principal est obligatoire'
      };
    }

    return { isValid: true, error: null };
  };

  // Fonctions utilitaires pour la validation
  const isValidHexColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  const validateStringLength = (value: string, min: number, max: number, fieldName: string): { isValid: boolean; error: string | null } => {
    if (value.length < min) {
      return { isValid: false, error: `${fieldName} doit contenir au moins ${min} caractères` };
    }
    if (value.length > max) {
      return { isValid: false, error: `${fieldName} ne peut pas dépasser ${max} caractères` };
    }
    return { isValid: true, error: null };
  };

  // Fonction de validation étendue pour d'autres champs importants
  const validateContentFields = (): { isValid: boolean; error: string | null } => {
    // Validation de la branding section (au-delà des champs essentiels)
    const branding = getContent('branding') as Record<string, string>;

    // Validation des couleurs
    if (!isValidHexColor(branding.logoColor)) {
      return { isValid: false, error: 'La couleur de l\'icône doit être une couleur hexadécimale valide (ex: #FFFFFF)' };
    }

    if (!isValidHexColor(branding.logoBgColor)) {
      return { isValid: false, error: 'La couleur de fond doit être une couleur hexadécimale valide (ex: #16A34A)' };
    }

    // Validation de la longueur du tagline (pas trop long)
    const taglineValidation = validateStringLength(branding.appTagline || '', 0, 100, 'Slogan');
    if (!taglineValidation.isValid) {
      return taglineValidation;
    }

    // Validation de la hero section
    const hero = getContent('hero') as Record<string, unknown>;

    // Validation de la longueur du badge (résonable)
    const badgeValidation = validateStringLength(String(hero.badge || ''), 0, 50, 'Badge');
    if (!badgeValidation.isValid) {
      return badgeValidation;
    }

    // Validation de la longueur du highlight (résonable)
    const highlightValidation = validateStringLength(String(hero.highlight || ''), 0, 30, 'Mot mis en évidence');
    if (!highlightValidation.isValid) {
      return highlightValidation;
    }

    // Validation de la longueur du subtitle (pas trop long)
    const subtitleValidation = validateStringLength(String(hero.subtitle || ''), 0, 200, 'Sous-titre');
    if (!subtitleValidation.isValid) {
      return subtitleValidation;
    }

    // Validation de la longueur des CTA (résonable)
    const ctaPrimaryValidation = validateStringLength(String(hero.ctaPrimary || ''), 0, 30, 'Bouton principal');
    if (!ctaPrimaryValidation.isValid) {
      return ctaPrimaryValidation;
    }

    const ctaSecondaryValidation = validateStringLength(String(hero.ctaSecondary || ''), 0, 30, 'Bouton secondaire');
    if (!ctaSecondaryValidation.isValid) {
      return ctaSecondaryValidation;
    }

    // Validation des trustBadges (chacun doit avoir une longueur raisonnable)
    const trustBadges = hero.trustBadges as string[] || [];
    for (let i = 0; i < trustBadges.length; i++) {
      const badgeValidation = validateStringLength(String(trustBadges[i]), 0, 30, `Badge de confiance ${i + 1}`);
      if (!badgeValidation.isValid) {
        return badgeValidation;
      }
    }

    // Si nous arrivons ici, toutes les validations sont passées
    return { isValid: true, error: null };
  };

  // Fonction pour basculer en mode aperçu (sans enregistrer)
  const handlePreview = () => {
    setPreviewMode(true);
  };

  // Fonction pour retourner au mode édition depuis l'aperçu
  const handleExitPreview = () => {
    setPreviewMode(false);
  };

  // Fonction de publication explicite (enregistre en base de données)
  const handlePublish = async () => {
    // Validation des champs essentiels avant publication
    const essentialValidation = validateEssentialFields();
    if (!essentialValidation.isValid) {
      toast.show(essentialValidation.error || 'Erreur de validation', 'error');
      return;
    }

    // Validation étendue du contenu avant publication
    const contentValidation = validateContentFields();
    if (!contentValidation.isValid) {
      toast.show(contentValidation.error || 'Erreur de validation', 'error');
      return;
    }

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
    await logAudit(appUser?.name || 'Système', 'UPDATE', 'site_content', null, `Contenu du site publié (${keys.join(', ')})`);
    toast.show('Contenu publié avec succès');
    setDrafts({}); // Réinitialiser les drafts après publication réussie
    setPreviewMode(false); // Quitter le mode aperçu
    refresh(); // Recharger les données depuis la base
    setSaving(false);
  };

  const handleSave = async () => {
    // Fonction de sauvegarde immédiate (maintenue pour compatibilité)
    // Validation des champs essentiels avant sauvegarde
    const essentialValidation = validateEssentialFields();
    if (!essentialValidation.isValid) {
      toast.show(essentialValidation.error || 'Erreur de validation', 'error');
      setSaving(false);
      return;
    }

    // Validation étendue du contenu avant sauvegarde
    const contentValidation = validateContentFields();
    if (!contentValidation.isValid) {
      toast.show(contentValidation.error || 'Erreur de validation', 'error');
      setSaving(false);
      return;
    }

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
    await logAudit(appUser?.name || 'Système', 'UPDATE', 'site_content', null, `Contenu du site enregistré (${keys.join(', ')})`);
    toast.show('Contenu enregistré avec succès');
    setDrafts({}); // Réinitialiser les drafts après enregistrement réussi
    refresh(); // Recharger les données depuis la base
    setSaving(false);
  };

  const handleReset = () => {
    setDrafts({});
    toast.show('Modifications annulées', 'info');
  };

  // Fonctions de gestion des fonctionnalités
  const startEditingFeature = (index: number) => {
    const feature = features[index];
    setEditingFeatureIndex(index);
    setEditFeatureTitle(feature.title || '');
    setEditFeatureIcon(feature.icon || 'Sprout');
    setEditFeatureDesc(feature.desc || '');
  };

  const cancelFeatureEdit = (index: number) => {
    setEditingFeatureIndex(null);
    setEditFeatureTitle('');
    setEditFeatureIcon('Sprout');
    setEditFeatureDesc('');
  };

  const saveFeatureEdit = (index: number) => {
    // Validation du titre obligatoire
    if (!editFeatureTitle || String(editFeatureTitle).trim() === '') {
      toast.show('Le titre est obligatoire', 'error');
      return;
    }

    // Mettre à jour la fonctionnalité en édition
    updateListItem('features', index, 'title', String(editFeatureTitle).trim());
    updateListItem('features', index, 'icon', editFeatureIcon);
    updateListItem('features', index, 'desc', String(editFeatureDesc).trim());

    // Quitter le mode édition
    setEditingFeatureIndex(null);
    setEditFeatureTitle('');
    setEditFeatureIcon('Sprout');
    setEditFeatureDesc('');

    toast.show('Fonctionnalité modifiée avec succès', 'success');
  };

  const startAddingFeature = () => {
    setIsAddingFeature(true);
    setNewFeatureTitle('');
    setNewFeatureIcon('Sprout');
    setNewFeatureDesc('');
    setNewFeatureTitleError(null);
  };

  const cancelAddFeature = () => {
    setIsAddingFeature(false);
    setNewFeatureTitle('');
    setNewFeatureIcon('Sprout');
    setNewFeatureDesc('');
    setNewFeatureTitleError(null);
  };

  const saveNewFeature = () => {
    // Validation du titre obligatoire
    if (!newFeatureTitle || String(newFeatureTitle).trim() === '') {
      setNewFeatureTitleError('Le titre est obligatoire');
      return;
    }

    // Ajouter la nouvelle fonctionnalité
    addListItem('features', {
      icon: newFeatureIcon,
      title: String(newFeatureTitle).trim(),
      desc: String(newFeatureDesc).trim()
    });

    // Quitter le mode ajout
    setIsAddingFeature(false);
    setNewFeatureTitle('');
    setNewFeatureIcon('Sprout');
    setNewFeatureDesc('');
    setNewFeatureTitleError(null);

    toast.show('Nouvelle fonctionnalité ajoutée avec succès', 'success');
  };

  const moveFeatureUp = (index: number) => {
    if (index <= 0) return;

    const list = [...(getListContent('features') as Record<string, unknown>[])];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    setDrafts({ ...drafts, 'features': list });

    toast.show('Fonctionnalité déplacée vers le haut', 'success');
  };

  const moveFeatureDown = (index: number) => {
    if (index >= features.length - 1) return;

    const list = [...(getListContent('features') as Record<string, unknown>[])];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    setDrafts({ ...drafts, 'features': list });

    toast.show('Fonctionnalité déplacée vers le bas', 'success');
  };

  const confirmDeleteFeature = (index: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette fonctionnalité ?')) {
      removeListItem('features', index);
      toast.show('Fonctionnalité supprimée avec succès', 'success');
    }
  };

  const hasDrafts = Object.keys(drafts).length > 0;

  // En mode aperçu, nous affichons toujours les valeurs des drafts (même vides)
  // En mode édition, nous utilisons getContent qui privilégie les drafts sur les valeurs publiées
  const branding = previewMode
    ? ((drafts.branding as Record<string, string>) || {})
    : getContent('branding') as Record<string, string>;

  const hero = previewMode
    ? ((drafts.hero as Record<string, unknown>) || {})
    : getContent('hero') as Record<string, unknown>;

  const heroCard = previewMode
    ? ((drafts.heroCard as Record<string, unknown>) || {})
    : getContent('heroCard') as Record<string, unknown>;

  const stats = previewMode
    ? ((drafts.stats as Record<string, string>[]) || [])
    : getListContent('stats') as Record<string, string>[];

  const features = previewMode
    ? ((drafts.features as Record<string, string>[]) || [])
    : getListContent('features') as Record<string, string>[];

  const featuresSection = previewMode
    ? ((drafts.featuresSection as Record<string, string>) || {})
    : getContent('featuresSection') as Record<string, string>;

  const workflow = previewMode
    ? ((drafts.workflow as Record<string, unknown>) || {})
    : getContent('workflow') as Record<string, unknown>;

  const rolesContent = previewMode
    ? ((drafts.roles as Record<string, unknown>) || {})
    : getContent('roles') as Record<string, unknown>;

  const cta = previewMode
    ? ((drafts.cta as Record<string, string>) || {})
    : getContent('cta') as Record<string, string>;

  const footer = previewMode
    ? ((drafts.footer as Record<string, unknown>) || {})
    : getContent('footer') as Record<string, unknown>;

  const login = previewMode
    ? ((drafts.login as Record<string, unknown>) || {})
    : getContent('login') as Record<string, unknown>;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Contenu du site"
        subtitle="Éditez tous les textes, le logo et les images du site vitrine"
        actions={
          <>
            {!previewMode && hasDrafts && (
              <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <RotateCcw size={16} /> Annuler
              </button>
            )}
            {!previewMode && hasDrafts && (
              <button onClick={handlePreview} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Eye size={16} /> {saving ? 'Prévisualisation...' : 'Prévisualiser'}
              </button>
            )}
            {previewMode && (
              <button onClick={handleExitPreview} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
                <X size={16} /> {saving ? 'Annulation...' : 'Retourner'}
              </button>
            )}
            {previewMode && (
              <button onClick={handlePublish} disabled={!hasDrafts || saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                <Save size={16} /> {saving ? 'Publication...' : 'Publier'}
              </button>
            )}
            {!previewMode && hasDrafts && (
              <button onClick={handleSave} disabled={!hasDrafts || saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            )}
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
                {features.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500">
                    Aucune fonctionnalité enregistrée. Commencez par ajouter votre première fonctionnalité ci-dessous.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {features.map((f, i) => {
                      const isEditing = editingFeatureIndex === i;
                      const displayTitle = f.title && String(f.title).trim() !== ''
                        ? String(f.title).trim()
                        : `Fonctionnalité sans titre (élément ${i + 1})`;

                      return (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-200">
                          {/* En-tête avec titre et actions */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                <Logo icon={f.icon || 'Sprout'} size={16} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">{displayTitle}</h4>
                                <p className="text-sm text-slate-500">{f.desc && String(f.desc).trim() !== ''
                                  ? String(f.desc).substring(0, 100) + (String(f.desc).length > 100 ? '...' : '')
                                  : 'Aucune description'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveFeatureEdit(i)} className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                                    <Save size={14} /> Appliquer
                                  </button>
                                  <button onClick={() => cancelFeatureEdit(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800">
                                    <X size={14} /> Annuler
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditingFeature(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800">
                                    <FileText size={14} /> Modifier
                                  </button>
                                  <button onClick={() => moveFeatureUp(i)} disabled={i === 0} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800">
                                    <ArrowUp size={14} /> Haut
                                  </button>
                                  <button onClick={() => moveFeatureDown(i)} disabled={i === features.length - 1} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800">
                                    <ArrowDown size={14} /> Bas
                                  </button>
                                  <button onClick={() => confirmDeleteFeature(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800">
                                    <Trash size={14} /> Supprimer
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Formulaire d'édition (affiché uniquement en mode édition) */}
                          {isEditing && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Titre</label>
                                  <input
                                    type="text"
                                    value={editFeatureTitle}
                                    onChange={e => setEditFeatureTitle(e.target.value)}
                                    className="form-input w-full"
                                    placeholder="Titre de la fonctionnalité"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Icône</label>
                                  <div className="flex flex-wrap gap-2">
                                    {ICON_CHOICES.map(ic => (
                                      <button
                                        key={ic}
                                        onClick={() => setEditFeatureIcon(ic)}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 ${editFeatureIcon === ic ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-200 text-slate-400'}`}
                                      >
                                        <Logo icon={ic} size={16} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                                  <textarea
                                    value={editFeatureDesc}
                                    onChange={e => setEditFeatureDesc(e.target.value)}
                                    className="form-input w-full"
                                    rows={3}
                                    placeholder="Description détaillée de la fonctionnalité"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Affichage normal (non-édition) */}
                          {!isEditing && (
                            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                <Logo icon={f.icon || 'Sprout'} size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{f.title || '[Sans titre]'}</p>
                                <p className="text-xs text-slate-500">{f.desc || '[Sans description]'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Bouton pour ajouter une nouvelle fonctionnalité */}
                    <div className="pt-4 border-t border-slate-200">
                      <button onClick={() => startAddingFeature()} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Plus size={16} /> Ajouter une fonctionnalité
                      </button>

                      {/* Formulaire d'ajout (affiché lorsque l'utilisateur clique sur "Ajouter une fonctionnalité") */}
                      {isAddingFeature && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Titre</label>
                              <input
                                type="text"
                                value={newFeatureTitle}
                                onChange={e => setNewFeatureTitle(e.target.value)}
                                className="form-input w-full"
                                placeholder="Titre de la fonctionnalité (obligatoire)"
                              />
                              {newFeatureTitleError && (
                                <p className="text-xs text-red-600 mt-1">{newFeatureTitleError}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Icône</label>
                              <div className="flex flex-wrap gap-2">
                                {ICON_CHOICES.map(ic => {
                                  const IcComp = getIcon(ic);
                                  return (
                                    <button
                                      key={ic}
                                      onClick={() => setNewFeatureIcon(ic)}
                                      className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 ${newFeatureIcon === ic ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-200 text-slate-400'}`}
                                    >
                                      <Logo icon={ic} size={16} />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                              <textarea
                                value={newFeatureDesc}
                                onChange={e => setNewFeatureDesc(e.target.value)}
                                className="form-input w-full"
                                rows={3}
                                placeholder="Description détaillée de la fonctionnalité"
                              />
                            </div>
                            <div className="flex items-center justify-end mt-3">
                              <button onClick={() => cancelAddFeature()} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800">
                                <X size={14} /> Annuler
                              </button>
                              <button onClick={() => saveNewFeature()} className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 ml-2">
                                <Save size={14} /> Enregistrer
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

          {hasDrafts && !previewMode && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
              <Eye size={16} /> Vous avez des modifications en cours. Cliquez sur « Enregistrer » pour appliquer immédiatement ou sur « Prévisualiser » pour voir le résultat avant publication.
            </div>
          )}

          {previewMode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
              <Eye size={16} /> Vous êtes en mode aperçu. Les modifications affichées ne sont pas encore publiées. Cliquez sur « Publier » pour rendre les modifications publiques ou sur « Retourner » pour revenir à l'édition.
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
