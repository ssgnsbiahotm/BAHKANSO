/**
 * Configuration.tsx — Module unifié et intelligent de configuration
 *
 * Fusionne SiteContentEditor (contenu du site) et SettingsPage (paramètres)
 * en un seul module repensé avec :
 *  - Système de brouillon unifié pour TOUS les changements
 *  - Validation intelligente par type de champ
 *  - Prévisualisation en temps réel
 *  - Suivi des modifications par champ/section
 *  - Accès basé sur les rôles (administrateur / propriétaire)
 *  - Journal d'audit automatique via Supabase
 *  - Sauvegarde et publication par lots
 *  - Upload de logo vers Supabase Storage
 *  - Gestion de listes complexes (ajout, suppression, réorder, édition inline)
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/Toast';
import { logAudit } from '@/lib/types';
import { validatePasswordStrength } from '@/lib/password';
import { PageHeader } from '@/components/ui/PageHeader';
import { Logo, getIcon } from '@/components/ui/Logo';
import {
  Settings, Globe, Layout, Monitor, Eye, EyeOff, Save, Upload,
  Trash2, RotateCcw, RefreshCw, AlertCircle, CheckCircle,
  Loader2, Plus, X, ChevronRight, Search, Filter,
  Edit3, Copy, Lock, Shield, Bell, Palette,
  Building2, DollarSign, Mail, Phone, MapPin,
  Home, BarChart3, Users as UsersIcon, Image as ImageIcon,
  Zap, Wand2, Target, Layers, Clock, History,
  FileText, ArrowUp, ArrowDown, Trash, ArrowLeft,
} from 'lucide-react';

/* ============================================================================
   TYPES
   ============================================================================ */

type ConfigDomain = 'exploitation' | 'contenu';

type ConfigSubsection =
  | 'informations'
  | 'devise'
  | 'securite'
  | 'notifications'
  | 'appearance'
  | 'branding'
  | 'hero'
  | 'heroCard'
  | 'stats'
  | 'features'
  | 'featuresSection'
  | 'workflow'
  | 'roles'
  | 'cta'
  | 'footer'
  | 'login';

type FieldType = 'text' | 'email' | 'url' | 'color' | 'number' | 'boolean' | 'textarea' | 'image' | 'select' | 'list' | 'object';

interface ConfigField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  description?: string;
  itemFields?: { id: string; label: string; type: FieldType; options?: { label: string; value: string | number }[] }[];
  itemTemplate?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
  rows?: number;
}

interface ConfigSection {
  id: ConfigSubsection;
  label: string;
  icon: React.ReactNode;
  domain: ConfigDomain;
  fields: ConfigField[];
  isList?: boolean;
  itemTemplate?: any;
}

interface DraftChange {
  path: string;
  subsection: ConfigSubsection;
  fieldId: string;
  value: any;
  originalValue: any;
}

/* ============================================================================
   CONSTANTES — ICONES ET COULEURS
   ============================================================================ */

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

/* ============================================================================
   DÉFINITION DES SECTIONS
   ============================================================================ */

const EXPLOITATION_SECTIONS: ConfigSection[] = [
  {
    id: 'informations',
    label: 'Informations de l’exploitation',
    icon: <Building2 size={20} />,
    domain: 'exploitation',
    fields: [
      { id: 'name', label: 'Nom de l’exploitation', type: 'text', required: true, placeholder: 'Ex: Ferme Bahkanso' },
      { id: 'location', label: 'Localisation', type: 'text', placeholder: 'Ville, Région, Pays' },
      { id: 'phone', label: 'Téléphone', type: 'text', placeholder: '+225 XX XX XX XX' },
      { id: 'email', label: 'Email de contact', type: 'email', placeholder: 'contact@exemple.com' },
    ],
  },
  {
    id: 'devise',
    label: 'Devise et finances',
    icon: <DollarSign size={20} />,
    domain: 'exploitation',
    fields: [
      { id: 'currency', label: 'Devise par défaut', type: 'select', required: true,
        options: [
          { label: 'Franc CFA (XOF)', value: 'XOF' },
          { label: 'Euro (EUR)', value: 'EUR' },
          { label: 'Dollar USD (USD)', value: 'USD' },
        ],
      },
    ],
  },
  {
    id: 'securite',
    label: 'Sécurité et accès',
    icon: <Shield size={20} />,
    domain: 'exploitation',
    fields: [
      { id: 'requireAuth', label: 'Authentification requise', type: 'boolean', description: 'Exiger une connexion pour accéder au site' },
      { id: 'allowPublicRegistration', label: 'Inscription publique autorisée', type: 'boolean', description: 'Permettre aux utilisateurs de s’inscrire sans invitation' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications et alertes',
    icon: <Bell size={20} />,
    domain: 'exploitation',
    fields: [
      { id: 'emailNotifications', label: 'Notifications par email', type: 'boolean' },
      { id: 'smsNotifications', label: 'Notifications par SMS', type: 'boolean' },
      { id: 'alertThreshold', label: 'Seuil d’alerte (stock bas)', type: 'number', placeholder: '10' },
    ],
  },
  {
    id: 'appearance',
    label: 'Apparence et logo',
    icon: <ImageIcon size={20} />,
    domain: 'exploitation',
    fields: [
      { id: 'logo_url', label: 'Logo de l’application', type: 'image', description: 'Le logo apparaît dans la barre latérale, l’en-tête et la page de connexion.' },
    ],
  },
];

const CONTENU_SECTIONS: ConfigSection[] = [
  {
    id: 'branding',
    label: 'Identité & Logo',
    icon: <Palette size={20} />,
    domain: 'contenu',
    fields: [
      { id: 'appName', label: 'Nom de l’application', type: 'text', required: true, placeholder: 'Bahkanso' },
      { id: 'appTagline', label: 'Slogan', type: 'text', placeholder: 'La plateforme d’investissement agro-pastoral' },
      { id: 'logoIcon', label: 'Icône du logo', type: 'select', options: ICON_CHOICES.map(i => ({ label: i, value: i })) },
      { id: 'logoColor', label: 'Couleur de l’icône', type: 'color' },
      { id: 'logoBgColor', label: 'Couleur de fond du logo', type: 'color' },
      { id: 'primaryColor', label: 'Couleur principale', type: 'color', description: 'Boutons, liens, accents' },
      { id: 'secondaryColor', label: 'Couleur secondaire', type: 'color', description: 'Éléments de support' },
      { id: 'accentColor', label: 'Couleur d’accentuation', type: 'color', description: 'Badges, alertes' },
      { id: 'footerText', label: 'Texte pied de page (sidebar)', type: 'text' },
      { id: 'footerSubtext', label: 'Sous-texte pied de page (sidebar)', type: 'text' },
    ],
  },
  {
    id: 'hero',
    label: 'Section Hero',
    icon: <Home size={20} />,
    domain: 'contenu',
    fields: [
      { id: 'badge', label: 'Badge', type: 'text', placeholder: 'Ex: Nouveau' },
      { id: 'title', label: 'Titre principal', type: 'text', required: true },
      { id: 'highlight', label: 'Mot mis en évidence', type: 'text' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', rows: 3 },
      { id: 'ctaPrimary', label: 'Bouton principal', type: 'text', placeholder: 'Démarrer' },
      { id: 'ctaSecondary', label: 'Bouton secondaire', type: 'text', placeholder: 'En savoir plus' },
      { id: 'trustBadges', label: 'Badges de confiance', type: 'list', itemFields: [{ id: 'value', label: 'Badge', type: 'text' }], itemTemplate: { value: 'Nouveau badge' } },
      { id: 'heroImage', label: 'Image du bandeau d’accueil', type: 'image', description: 'JPEG, PNG ou WebP — max 5 Mo' },
      { id: 'heroAlt', label: 'Texte alternatif', type: 'text', placeholder: 'Description de l’image du bandeau' },
    ],
  },
  {
    id: 'heroCard',
    label: 'Carte Hero',
    icon: <Layout size={20} />,
    domain: 'contenu',
    fields: [
      { id: 'label', label: 'Libellé', type: 'text' },
      { id: 'value', label: 'Valeur', type: 'text' },
      { id: 'trend', label: 'Tendance', type: 'text' },
      { id: 'items', label: 'Statistiques (3 colonnes)', type: 'list', itemFields: [{ id: 'label', label: 'Libellé', type: 'text' }, { id: 'value', label: 'Valeur', type: 'text' }], itemTemplate: { label: '', value: '' } },
      { id: 'lines', label: 'Lignes affichées', type: 'list', itemFields: [{ id: 'text', label: 'Texte', type: 'text' }, { id: 'value', label: 'Valeur', type: 'text' }], itemTemplate: { text: '', value: '' } },
    ],
  },
  {
    id: 'stats',
    label: 'Statistiques',
    icon: <BarChart3 size={20} />,
    domain: 'contenu',
    isList: true,
    itemTemplate: { value: '0', label: 'Nouveau' },
    fields: [
      { id: 'value', label: 'Valeur', type: 'text' },
      { id: 'label', label: 'Libellé', type: 'text' },
    ],
  },
  {
    id: 'features',
    label: 'Fonctionnalités',
    icon: <Zap size={20} />,
    domain: 'contenu',
    isList: true,
    itemTemplate: { icon: 'Sprout', title: '', desc: '' },
    fields: [
      { id: 'icon', label: 'Icône', type: 'select', options: ICON_CHOICES.map(i => ({ label: i, value: i })) },
      { id: 'title', label: 'Titre', type: 'text' },
      { id: 'desc', label: 'Description', type: 'textarea' },
    ],
  },
  {
    id: 'featuresSection',
    label: 'Titre section Fonctionnalités',
    icon: <Wand2 size={20} />,
    domain: 'contenu',
    fields: [
      { id: 'title', label: 'Titre', type: 'text' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'workflow',
    label: 'Processus',
    icon: <Layers size={20} />,
    domain: 'contenu',
    fields: [
      { id: 'title', label: 'Titre', type: 'text' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', rows: 2 },
      { id: 'steps', label: 'Étapes', type: 'list', itemFields: [{ id: 'icon', label: 'Icône', type: 'select', options: ICON_CHOICES.map(i => ({ label: i, value: i })) }, { id: 'label', label: 'Libellé', type: 'text' }], itemTemplate: { icon: 'Check', label: 'Nouvelle étape' } },
    ],
  },
  {
    id: 'roles',
    label: 'Rôles',
    icon: <UsersIcon size={20} />,
    domain: 'contenu',
    fields: [
      { id: 'title', label: 'Titre', type: 'text' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', rows: 2 },
      { id: 'list', label: 'Liste des rôles', type: 'list', itemFields: [{ id: 'value', label: 'Rôle', type: 'text' }], itemTemplate: { value: 'Nouveau rôle' } },
    ],
  },
  {
    id: 'cta',
    label: 'Section CTA',
    icon: <Target size={20} />,
    domain: 'contenu',
    fields: [
      { id: 'title', label: 'Titre', type: 'text', required: true },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', rows: 2 },
      { id: 'primary', label: 'Bouton principal', type: 'text' },
      { id: 'secondary', label: 'Bouton secondaire', type: 'text' },
    ],
  },
  {
    id: 'footer',
    label: 'Pied de page',
    icon: <Layout size={20} />,
    domain: 'contenu',
    fields: [
      { id: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { id: 'modulesTitle', label: 'Titre modules', type: 'text' },
      { id: 'modules', label: 'Liste modules', type: 'list', itemFields: [{ id: 'value', label: 'Module', type: 'text' }], itemTemplate: { value: 'Nouveau module' } },
      { id: 'securityTitle', label: 'Titre sécurité', type: 'text' },
      { id: 'security', label: 'Éléments sécurité', type: 'list', itemFields: [{ id: 'icon', label: 'Icône', type: 'select', options: ICON_CHOICES.map(i => ({ label: i, value: i })) }, { id: 'text', label: 'Texte', type: 'text' }], itemTemplate: { icon: 'Shield', text: '' } },
      { id: 'copyright', label: 'Copyright', type: 'text' },
    ],
  },
  {
    id: 'login',
    label: 'Page de connexion',
    icon: <Lock size={20} />,
    domain: 'contenu',
    fields: [
      { id: 'title', label: 'Titre', type: 'text' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', rows: 3 },
      { id: 'benefits', label: 'Avantages', type: 'list', itemFields: [{ id: 'value', label: 'Avantage', type: 'text' }], itemTemplate: { value: 'Nouvel avantage' } },
      { id: 'quote', label: 'Citation', type: 'textarea', rows: 2 },
      { id: 'quoteAuthor', label: 'Auteur de la citation', type: 'text' },
    ],
  },
];

const ALL_SECTIONS = [...EXPLOITATION_SECTIONS, ...CONTENU_SECTIONS];

/* ============================================================================
   HELPERS
   ============================================================================ */

const domainLabel = (d: ConfigDomain): string =>
  d === 'exploitation' ? 'Paramètres de l’exploitation' : 'Contenu du site';

const domainColor = (d: ConfigDomain): string =>
  d === 'exploitation' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100';

const getDraftPath = (domain: ConfigDomain, subsection: ConfigSubsection, fieldId: string): string =>
  `${domain}:${subsection}:${fieldId}`;

const isFarmSection = (subsection: ConfigSubsection): boolean =>
  subsection === 'informations' || subsection === 'devise' || subsection === 'securite' || subsection === 'notifications' || subsection === 'appearance';

/* ============================================================================
   COMPOSANT PRINCIPAL
   ============================================================================ */

export function Configuration() {
  const { siteContent, farm, refresh } = useData();
  const { authUser, appUser, updatePassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // --- État du domaine et sous-section actifs ---
  const [activeDomain, setActiveDomain] = useState<ConfigDomain>('exploitation');
  const [activeSubsection, setActiveSubsection] = useState<ConfigSubsection>('informations');

  // --- Brouillons unifiés (clé : "domaine:subsection:champ" -> valeur) ---
  const [drafts, setDrafts] = useState<DraftChange[]>([]);

  // --- État UI ---
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);

  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- État changement de mot de passe ---
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

const handlePasswordChange = async () => {
    setPasswordError(null);
    const validation = validatePasswordStrength(passwordForm.new);
    if (!validation.isValid) {
      setPasswordError(validation.errors.join(' \u2022 '));
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await updatePassword(passwordForm.new);
      if (error) {
        setPasswordError(error);
      } else {
        toast.show('Mot de passe modifié avec succès');
        setPasswordForm({ new: '', confirm: '' });
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- Vérification des droits ---
  const isAuthorized = useMemo(() => {
    if (!authUser || !appUser) return false;
    const role = appUser.role;
    return role === 'administrateur' || role === 'proprietaire' || role === 'admin' || role === 'owner';
  }, [authUser, appUser]);

  // --- Valeurs actuelles (farm + siteContent fusionnées) ---
  const currentValues = useMemo((): Record<string, any> => {
    const values: Record<string, any> = {};

    // Farm fields
    if (farm) {
      values[getDraftPath('exploitation', 'informations', 'name')] = farm.name;
      values[getDraftPath('exploitation', 'informations', 'location')] = farm.location;
      values[getDraftPath('exploitation', 'informations', 'phone')] = farm.phone;
      values[getDraftPath('exploitation', 'informations', 'email')] = farm.email;
      values[getDraftPath('exploitation', 'devise', 'currency')] = farm.currency;
      values[getDraftPath('exploitation', 'securite', 'requireAuth')] = (siteContent['securite']?.value as any)?.requireAuth ?? false;
      values[getDraftPath('exploitation', 'securite', 'allowPublicRegistration')] = (siteContent['securite']?.value as any)?.allowPublicRegistration ?? false;
      values[getDraftPath('exploitation', 'notifications', 'emailNotifications')] = (siteContent['notifications']?.value as any)?.emailNotifications ?? true;
      values[getDraftPath('exploitation', 'notifications', 'smsNotifications')] = (siteContent['notifications']?.value as any)?.smsNotifications ?? false;
      values[getDraftPath('exploitation', 'notifications', 'alertThreshold')] = (siteContent['notifications']?.value as any)?.alertThreshold ?? 10;
      values[getDraftPath('exploitation', 'appearance', 'logo_url')] = farm.logo_url;
    }

    // Site content fields
    for (const section of CONTENU_SECTIONS) {
      const content = siteContent[section.id];
      const contentValue = (content?.value as any) || {};
      for (const field of section.fields) {
        values[getDraftPath('contenu', section.id, field.id)] = contentValue[field.id];
      }
    }

    return values;
  }, [farm, siteContent]);

  // --- Valeur effective (brouillon si existe, sinon valeur actuelle) ---
  const getEffectiveValue = useCallback((path: string) => {
    const draft = drafts.find(d => d.path === path);
    return draft !== undefined ? draft.value : currentValues[path];
  }, [drafts, currentValues]);

  // --- Détection des champs modifiés ---
  const changedFields = useMemo(() => {
    return drafts.filter(d => JSON.stringify(d.value) !== JSON.stringify(d.originalValue));
  }, [drafts]);

  const hasDrafts = changedFields.length > 0;

  // --- Recherche / filtrage des sections ---
  const filteredSections = useMemo(() => {
    if (!searchQuery) return ALL_SECTIONS;
    const q = searchQuery.toLowerCase();
    return ALL_SECTIONS.filter(s =>
      s.label.toLowerCase().includes(q) ||
      s.fields.some(f => f.label.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // --- Gestion des brouillons ---
  const updateDraft = useCallback((domain: ConfigDomain, subsection: ConfigSubsection, fieldId: string, value: any) => {
    const path = getDraftPath(domain, subsection, fieldId);
    const originalValue = currentValues[path];

    setDrafts(prev => {
      const existing = prev.findIndex(d => d.path === path);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { path, subsection, fieldId, value, originalValue };
        if (JSON.stringify(value) === JSON.stringify(originalValue)) {
          next.splice(existing, 1);
        }
        return next;
      }
      return [...prev, { path, subsection, fieldId, value, originalValue }];
    });

    if (autoSaveEnabled) {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => {
        void saveAllDrafts();
      }, 2000);
    }
  }, [currentValues, autoSaveEnabled]);

  const resetField = useCallback((path: string) => {
    setDrafts(prev => prev.filter(d => d.path !== path));
  }, []);

  const resetAllDrafts = useCallback(() => {
    setDrafts([]);
  }, []);

  // --- Sauvegarde ---
  const saveAllDrafts = useCallback(async () => {
    if (!hasDrafts) return;
    if (!isAuthorized) {
      toast.show('Seuls les administrateurs peuvent modifier la configuration.', 'error');
      return;
    }

    setSaving(true);
    try {
      const farmUpdates: Record<string, any> = {};
      const siteContentUpserts: Array<{ key: string; value: any; updated_at: string }> = [];
      const changedSubsections: ConfigSubsection[] = [];

      for (const change of changedFields) {
        const [domain, subsection, fieldId] = change.path.split(':') as [ConfigDomain, ConfigSubsection, string];

        if (isFarmSection(subsection) && subsection !== 'securite' && subsection !== 'notifications') {
          if (subsection === 'appearance') {
            if (change.value) farmUpdates.logo_url = change.value;
          } else {
            farmUpdates[fieldId] = change.value;
          }
          changedSubsections.push(subsection);
        } else {
          let entry = siteContentUpserts.find(e => e.key === subsection);
          if (!entry) {
            const existing = siteContent[subsection];
            entry = {
              key: subsection,
              value: existing ? { ...(existing.value as any) } : {},
              updated_at: new Date().toISOString(),
            };
            siteContentUpserts.push(entry);
          }
          (entry.value as any)[fieldId] = change.value;
          changedSubsections.push(subsection);
        }
      }

      // Mettre à jour la ferme
      if (Object.keys(farmUpdates).length > 0 && farm) {
        const { error: farmError } = await supabase
          .from('farms')
          .update({ ...farmUpdates, updated_at: new Date().toISOString() })
          .eq('id', farm.id);
        if (farmError) throw farmError;
      }

      // Upsert du contenu du site
      for (const entry of siteContentUpserts) {
        const { error } = await supabase
          .from('site_content')
          .upsert({
            key: entry.key,
            value: entry.value,
            updated_at: entry.updated_at,
          });
        if (error) throw error;
      }

      // Journal d’audit
      if (authUser) {
        await logAudit(
          appUser?.name || authUser?.email || 'Système',
          'UPDATE',
          'configuration',
          farm?.id || null,
          `Configuration unifiée modifiée (${changedFields.length} champ(s), ${[...new Set(changedSubsections)].length} section(s))`,
          null,
          { fields: changedFields.length, subsections: [...new Set(changedSubsections)] },
        );
      }

      setDrafts([]);
      setLastSaved(new Date());
      await refresh();

      toast.show(`${changedFields.length} modification(s) appliquée(s) avec succès.`, 'success');
    } catch (err) {
      toast.show('Erreur lors de l’enregistrement : ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    } finally {
      setSaving(false);
    }
  }, [hasDrafts, changedFields, farm, siteContent, isAuthorized, authUser, refresh, toast]);

  // --- Upload de logo ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `logo/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('app-assets').upload(fileName, file);
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('app-assets').getPublicUrl(fileName);
      const logoUrl = pub.publicUrl;

      const path = getDraftPath('exploitation', 'appearance', 'logo_url');
      updateDraft('exploitation', 'appearance', 'logo_url', logoUrl);

      const { error: updErr } = await supabase
        .from('farms')
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq('id', farm.id);
      if (updErr) throw updErr;

      await logAudit(
        appUser?.name || authUser?.email || 'Système',
        'UPDATE',
        'farm',
        farm.id,
        'Logo de l’application modifié',
        null,
        { logo_url: logoUrl },
      );

      toast.show('Logo mis à jour avec succès');
      await refresh();
    } catch (err) {
      toast.show('Erreur upload: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!farm) return;
    try {
      updateDraft('exploitation', 'appearance', 'logo_url', null);
      const { error } = await supabase
        .from('farms')
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq('id', farm.id);
      if (error) throw error;

      await logAudit(appUser?.name || authUser?.email || 'Système', 'UPDATE', 'farm', farm.id, 'Logo supprimé');
      toast.show('Logo supprimé');
      await refresh();
    } catch (err) {
      toast.show('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
  };

  // --- Upload image hero ---
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !isAuthorized) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.show('L’image ne doit pas dépasser 5 Mo', 'error');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.show('Format non supporté : JPEG, PNG ou WebP uniquement.', 'error');
      return;
    }

    setUploadingHeroImage(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').replace(/[^a-zA-Z0-9]/g, '');
      const fileName = `hero/hero-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('app-assets').upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('app-assets').getPublicUrl(fileName);
      const imageUrl = pub.publicUrl;

      const path = getDraftPath('contenu', 'hero', 'heroImage');
      updateDraft('contenu', 'hero', 'heroImage', imageUrl);

      toast.show('Image du bandeau prévisualisée', 'success');
    } catch (err) {
      toast.show('Erreur upload: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleRemoveHeroImage = async () => {
    if (!isAuthorized) return;
    try {
      updateDraft('contenu', 'hero', 'heroImage', null);
      updateDraft('contenu', 'hero', 'heroAlt', '');
      toast.show('Image du bandeau retirée');
    } catch (err) {
      toast.show('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
  };

  // --- Prévisualisation du branding ---
  const previewBranding = useMemo(() => {
    const brandingPath = getDraftPath('contenu', 'branding', 'appName');
    const taglinePath = getDraftPath('contenu', 'branding', 'appTagline');
    const iconPath = getDraftPath('contenu', 'branding', 'logoIcon');
    const colorPath = getDraftPath('contenu', 'branding', 'logoColor');
    const bgColorPath = getDraftPath('contenu', 'branding', 'logoBgColor');
    const logoPath = getDraftPath('exploitation', 'appearance', 'logo_url');

    return {
      appName: getEffectiveValue(brandingPath) || 'Bahkanso',
      appTagline: getEffectiveValue(taglinePath) || '',
      logoIcon: getEffectiveValue(iconPath) || 'Sprout',
      logoColor: getEffectiveValue(colorPath) || '#16A34A',
      logoBgColor: getEffectiveValue(bgColorPath) || '#FFFFFF',
      logoUrl: getEffectiveValue(logoPath) || undefined,
    };
  }, [getEffectiveValue]);

  // Appliquer les couleurs de palette à la racine du document
  useEffect(() => {
    const primary = getEffectiveValue(getDraftPath('contenu', 'branding', 'primaryColor'));
    const secondary = getEffectiveValue(getDraftPath('contenu', 'branding', 'secondaryColor'));
    const accent = getEffectiveValue(getDraftPath('contenu', 'branding', 'accentColor'));
    if (primary) document.documentElement.style.setProperty('--color-primary', primary);
    if (secondary) document.documentElement.style.setProperty('--color-secondary', secondary);
    if (accent) document.documentElement.style.setProperty('--color-accent', accent);
  }, [getEffectiveValue]);

  // Nettoyer le timeout à la destruction
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, []);

  // --- Déterminer la sous-section par défaut selon l'URL ---
  useEffect(() => {
    const path = location.pathname;
    const subsectionMatch = path.match(/\/(informations|devise|securite|notifications|appearance|branding|hero|heroCard|stats|features|featuresSection|workflow|roles|cta|footer|login)$/);
    if (subsectionMatch) {
      const sub = subsectionMatch[1] as ConfigSubsection;
      setActiveSubsection(sub);
      setActiveDomain(
        sub === 'informations' || sub === 'devise' || sub === 'securite' ||
        sub === 'notifications' || sub === 'appearance' ? 'exploitation' : 'contenu'
      );
    }
  }, [location.pathname]);

  // --- Sections du domaine actif ---
  const activeSections = useMemo(() =>
    ALL_SECTIONS.filter(s => s.domain === activeDomain),
  [activeDomain]);

  // --- Section active ---
  const activeSection = activeSections.find(s => s.id === activeSubsection);

  // --- Vérifier si une section a des changements ---
  const sectionHasChanges = (subsection: ConfigSubsection) =>
    drafts.some(d => d.subsection === subsection);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ==================================================================== */}
      {/* SIDEBAR DE CONFIGURATION */}
      {/* ==================================================================== */}
      <aside className="hidden lg:flex lg:w-72 flex-col border-r border-slate-200 bg-white">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Settings size={24} className="text-indigo-600" />
            <h2 className="font-bold text-lg text-slate-800">Configuration</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">Gestion unifiée des paramètres</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Sélecteur de domaine */}
          <div className="flex gap-1 mb-3">
            {(['exploitation', 'contenu'] as ConfigDomain[]).map(d => (
              <button
                key={d}
                onClick={() => {
                  setActiveDomain(d);
                  setActiveSubsection(
                    (d === 'exploitation' ? EXPLOITATION_SECTIONS : CONTENU_SECTIONS)[0].id
                  );
                }}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeDomain === d
                    ? d === 'exploitation' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d === 'exploitation' ? <Building2 size={14} className="mr-2" /> : <Globe size={14} className="mr-2" />}
                {domainLabel(d)}
              </button>
            ))}
          </div>

          <div className="space-y-0.5">
            {activeSections.map(section => {
              const isActive = activeSubsection === section.id;
              const hasChanges = sectionHasChanges(section.id);
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSubsection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${hasChanges ? 'border-l-2 border-amber-500' : ''}`}
                >
                  {section.icon}
                  <span className="flex-1 text-left">{section.label}</span>
                  {hasChanges && (
                    <span className="flex-shrink-0 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded">
                      Modifié
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {hasDrafts && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-amber-700 mb-2">
                <AlertCircle size={14} /> {changedFields.length} modification(s) en attente
              </div>
              <button
                onClick={saveAllDrafts}
                disabled={saving}
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
              >
                {saving ? <Loader2 size={14} /> : <Save size={14} />} Publier tout
              </button>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={12} />
            <span>Dernière sauvegarde : {lastSaved ? lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Jamais'}</span>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* CONTENU PRINCIPAL */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {activeSection ? activeSection.label : 'Configuration'}
            </h1>
            <p className="text-sm text-slate-500">
              {domainLabel(activeDomain)} · {activeSection?.fields.length || 0} paramètre(s)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un paramètre…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64"
              />
            </div>

            <button
              onClick={resetAllDrafts}
              disabled={!hasDrafts || saving}
              className={`px-3 py-2 text-xs text-slate-500 hover:text-slate-700 ${
                !hasDrafts || saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw size={14} className="mr-1" /> Tout réinitialiser
            </button>

            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-2 text-xs rounded-md transition-colors ${
                previewMode ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {previewMode ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
              {previewMode ? 'Quitter l’aperçu' : 'Aperçu'}
            </button>

            <button
              onClick={saveAllDrafts}
              disabled={!hasDrafts || saving}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !hasDrafts || saving
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
              Enregistrer
            </button>
          </div>
        </header>

        {/* Zone d’alerte si non autorisé */}
        {!isAuthorized && (
          <div className="bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <AlertCircle size={16} />
              <strong>Accès en lecture seule.</strong> Seuls les administrateurs et propriétaires peuvent modifier la configuration.
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          {!activeSection ? (
            <div className="text-center py-20">
              <Globe size={48} className="mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-900">Aucune section sélectionnée</h3>
              <p className="text-slate-500">Choisissez une section dans la barre latérale.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Badge de domaine */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${domainColor(activeDomain)} border`}>
                {activeDomain === 'exploitation' ? <Building2 size={12} /> : <Globe size={12} />}
                {domainLabel(activeDomain)}
              </div>

              {/* Logo upload pour la section appearance */}
              {activeSubsection === 'appearance' && farm && (
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><ImageIcon size={18} /> Logo de l’application</h3>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-20 h-20 rounded-xl border-2 border-slate-200 overflow-hidden flex items-center justify-center bg-white flex-shrink-0">
                      {farm.logo_url ? (
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
                        onChange={handleLogoUpload}
                      />
                      <button
                        onClick={() => logoFileRef.current?.click()}
                        disabled={uploadingLogo || !farm}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {uploadingLogo ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Upload size={16} />
                        )}
                        {uploadingLogo ? 'Upload…' : 'Changer le logo'}
                      </button>
                      {farm.logo_url && (
                        <button
                          onClick={handleRemoveLogo}
                          className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Retirer
                        </button>
                      )}
                      <p className="text-xs text-slate-400 mt-2">PNG, JPG — max 2 Mo. L’image est recadrée en carré.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload image hero pour la section hero */}
              {activeSubsection === 'hero' && (
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><ImageIcon size={18} /> Image du bandeau d’accueil</h3>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-64 h-40 rounded-xl border-2 border-slate-200 overflow-hidden flex items-center justify-center bg-white flex-shrink-0">
                      {getEffectiveValue(getDraftPath('contenu', 'hero', 'heroImage')) ? (
                        <img
                          src={String(getEffectiveValue(getDraftPath('contenu', 'hero', 'heroImage')))}
                          alt={String(getEffectiveValue(getDraftPath('contenu', 'hero', 'heroAlt')) || 'Bandeau')}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={32} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={heroFileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleHeroImageUpload}
                      />
                      <button
                        onClick={() => heroFileRef.current?.click()}
                        disabled={uploadingHeroImage || !isAuthorized}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {uploadingHeroImage ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Upload size={16} />
                        )}
                        {uploadingHeroImage ? 'Upload…' : 'Choisir l’image'}
                      </button>
                      {Boolean(getEffectiveValue(getDraftPath('contenu', 'hero', 'heroImage'))) && (
                        <button
                          onClick={handleRemoveHeroImage}
                          className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Retirer
                        </button>
                      )}
                      <p className="text-xs text-slate-400 mt-2">JPEG, PNG ou WebP — max 5 Mo. Pas de SVG.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description de la section */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-2">{activeSection.label}</h2>
                <p className="text-slate-500 text-sm">
                  Configurez les paramètres de {activeSection.label.toLowerCase()}.
                  {hasDrafts ? 'Les modifications apparaissent en brouillon jusqu’à publication.' : ''}
                </p>
              </div>

              {/* Formulaire des champs */}
              <div className="space-y-4">
                {activeSection.fields.map(field => {
                  const path = getDraftPath(activeDomain, activeSubsection, field.id);
                  const currentValue = currentValues[path];
                  const effectiveValue = getEffectiveValue(path);
                  const isChanged = drafts.some(d => d.path === path && JSON.stringify(d.value) !== JSON.stringify(d.originalValue));
                  const isInvalid = validateField(field, effectiveValue);

                  return (
                    <div key={field.id} className="bg-white p-5 rounded-xl border border-slate-200 relative group">
                      {isChanged && (
                        <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded">
                          <RefreshCw size={12} className="mr-1" /> Modifié
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600">
                            {getFieldIcon(field.type)}
                          </div>
                        </div>

                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {field.description && (
                            <p className="text-xs text-slate-400 mb-2">{field.description}</p>
                          )}

                          {field.type === 'list' ? (
                            <ListEditor
                              field={field}
                              value={Array.isArray(effectiveValue) ? effectiveValue : []}
                              onChange={(val) => updateDraft(activeDomain, activeSubsection, field.id, val)}
                              isAuthorized={isAuthorized}
                            />
                          ) : (
                            renderFieldInput(field, effectiveValue, isInvalid, isAuthorized, (v) =>
                              updateDraft(activeDomain, activeSubsection, field.id, v)
                            )
                          )}

                          {isInvalid && (
                            <p className="text-xs text-red-500 mt-1">{isInvalid.message || 'Valeur invalide'}</p>
                          )}
                        </div>

                        {!isAuthorized && (
                          <Lock size={16} className="text-slate-400 mt-1 self-start" />
                        )}
                      </div>

                      {field.type !== 'list' && (
                        <button
                          onClick={() => resetField(path)}
                          disabled={!isChanged || saving || !isAuthorized}
                          className="absolute bottom-2 right-2 text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
                        >
                          <RotateCcw size={12} /> Annuler
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Boutons d’action supplémentaires */}
              {hasDrafts && (
                <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={saveAllDrafts}
                    disabled={saving || !isAuthorized}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Save size={18} /> Publier {changedFields.length} modification(s)
                  </button>
                  <button
                    onClick={resetAllDrafts}
                    disabled={saving || !isAuthorized}
                    className="px-6 py-3 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 font-medium transition-colors"
                  >
                    Annuler tout
                  </button>
                </div>
              )}

              {/* Section : Changer mon mot de passe */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Lock size={16} /> Changer mon mot de passe
                </h3>
                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="Au moins 8 caractères"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="Répéter le mot de passe"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-600">{passwordError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={passwordLoading || !passwordForm.new}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {passwordLoading ? 'Modification…' : 'Modifier le mot de passe'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODAL D’APERÇU */}
      {/* ==================================================================== */}
      {previewMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm">
          <div className="absolute top-6 right-6">
            <button
              onClick={() => setPreviewMode(false)}
              className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              <X size={18} className="mr-2" /> Fermer l’aperçu
            </button>
          </div>
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${previewBranding.logoBgColor} text-white`}>
                      <Palette size={24} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900">{previewBranding.appName}</h1>
                      <p className="text-slate-500 text-sm">{previewBranding.appTagline}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {[1, 2, 3].map(i => {
                    const stats = getEffectiveValue(getDraftPath('contenu', 'stats', `stat${i}Label`));
                    const statValue = getEffectiveValue(getDraftPath('contenu', 'stats', `stat${i}Value`));
                    if (!stats && !statValue) return null;
                    return (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-semibold">{stats || `Stat ${i}`}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{statValue || '—'}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900">Fonctionnalités</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => {
                      const title = getEffectiveValue(getDraftPath('contenu', 'features', `feature${i}Title`));
                      const desc = getEffectiveValue(getDraftPath('contenu', 'features', `feature${i}Desc`));
                      if (!title && !desc) return null;
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <Zap size={18} className="text-indigo-500 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-slate-900">{title}</h4>
                            <p className="text-sm text-slate-600">{desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    {getEffectiveValue(getDraftPath('contenu', 'branding', 'footerText')) || 'Bahkanso'} · v1.0
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   LIST EDITOR — Gestion de tableaux complexes (ajout, suppression, réorder, édition inline)
   ============================================================================ */

function ListEditor({
  field,
  value,
  onChange,
  isAuthorized,
}: {
  field: ConfigField;
  value: any[];
  onChange: (val: any[]) => void;
  isAuthorized: boolean;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const itemFields = field.itemFields || [{ id: 'value', label: 'Valeur', type: 'text' }];

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValues({ ...value[index] });
  };

  const cancelEdit = (index: number) => {
    setEditingIndex(null);
    setEditValues({});
  };

  const saveEdit = (index: number) => {
    const next = [...value];
    next[index] = { ...next[index], ...editValues };
    onChange(next);
    setEditingIndex(null);
    setEditValues({});
  };

  const addItem = () => {
    const template = { ...(field.itemTemplate || {}) };
    onChange([...value, template]);
  };

  const removeItem = (index: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      onChange(value.filter((_, i) => i !== index));
    }
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...value];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index >= value.length - 1) return;
    const next = [...value];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    onChange(next);
  };

  const inputClasses = `w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
    !isAuthorized ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-slate-300'
  }`;

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500">
          Aucun élément enregistré. Commencez par ajouter votre premier élément ci-dessous.
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((item, i) => {
            const isEditing = editingIndex === i;
            return (
              <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
                {isEditing ? (
                  <div className="space-y-2">
                    {itemFields.map(f => (
                      <div key={f.id} className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">{f.label}</label>
                        <input
                          type={f.type === 'textarea' ? 'textarea' : 'text'}
                          value={editValues[f.id] || ''}
                          onChange={e => setEditValues({ ...editValues, [f.id]: e.target.value })}
                          disabled={!isAuthorized}
                          className={inputClasses + (f.type === 'textarea' ? ' h-24' : '')}
                        />
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <button onClick={() => saveEdit(i)} disabled={!isAuthorized}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                        <Save size={14} /> Appliquer
                      </button>
                      <button onClick={() => cancelEdit(i)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800">
                        <X size={14} /> Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {itemFields.map(f => {
                        const val = item[f.id];
                        if (f.type === 'select') {
                          return (
                            <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100">
                              {val || '—'}
                            </span>
                          );
                        }
                        return (
                          <span key={f.id} className="text-sm text-slate-700 truncate max-w-[200px]">{val || '—'}</span>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(i)} disabled={!isAuthorized}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800 disabled:opacity-50">
                        <FileText size={14} /> Modifier
                      </button>
                      <button onClick={() => moveUp(i)} disabled={i === 0 || !isAuthorized}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800 disabled:opacity-50">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => moveDown(i)} disabled={i === value.length - 1 || !isAuthorized}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800 disabled:opacity-50">
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={() => removeItem(i)} disabled={!isAuthorized}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50">
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-3 border-t border-slate-200">
        <button onClick={addItem} disabled={!isAuthorized}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          <Plus size={16} /> Ajouter un élément
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   RENDU DES CHAMPS DE FORMULAIRE SIMPLES
   ============================================================================ */

function renderFieldInput(
  field: ConfigField,
  value: any,
  isInvalid: { message?: string } | null,
  isAuthorized: boolean,
  onChange: (v: any) => void
) {
  const inputClasses = `w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
    isInvalid ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
  } ${!isAuthorized ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`;

  switch (field.type) {
    case 'color':
      return (
        <div className="flex items-center gap-3 flex-wrap">
          {COLOR_CHOICES.map(c => (
            <button
              key={c}
              onClick={() => onChange(c)}
              disabled={!isAuthorized}
              className={`w-8 h-8 rounded-lg border-2 ${(value || '#FFFFFF') === c ? 'border-slate-900 ring-2 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={value || '#ffffff'}
            onChange={e => onChange(e.target.value)}
            disabled={!isAuthorized}
            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer bg-transparent"
          />
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => onChange(e.target.checked)}
            disabled={!isAuthorized}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-600">{Boolean(value) ? 'Activé' : 'Désactivé'}</span>
        </div>
      );

    case 'image':
      // L'image hero est gérée par le bloc dédié de prévisualisation/upload.
      return null;

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          disabled={!isAuthorized}
          className={inputClasses}
        >
          <option value="">Sélectionner…</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );

    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={field.rows || 3}
          disabled={!isAuthorized}
          className={inputClasses}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
          disabled={!isAuthorized}
          className={inputClasses}
        />
      );

    default:
      return (
        <input
          type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={!isAuthorized}
          className={inputClasses}
        />
      );
  }
}

/* ============================================================================
   VALIDATION INTELLIGENTE
   ============================================================================ */

function validateField(field: ConfigField, value: any): { message?: string } | null {
  if (field.required && (value === undefined || value === null || value === '')) {
    return { message: `${field.label} est requis.` };
  }
  if (value === undefined || value === null || value === '') return null;

  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
    return { message: 'Format d’email invalide.' };
  }
  if (field.type === 'url') {
    try { new URL(String(value)); } catch { return { message: 'URL invalide.' }; }
  }
  if (field.type === 'number') {
    const n = Number(value);
    if (isNaN(n)) return { message: 'Doit être un nombre.' };
    if (field.validation?.min !== undefined && n < field.validation.min) {
      return { message: `Doit être supérieur ou égal à ${field.validation.min}.` };
    }
    if (field.validation?.max !== undefined && n > field.validation.max) {
      return { message: `Doit être inférieur ou égal à ${field.validation.max}.` };
    }
  }
  return null;
}

/* ============================================================================
   ICONES PAR TYPE DE CHAMP
   ============================================================================ */

function getFieldIcon(type: FieldType): React.ReactNode {
  switch (type) {
    case 'text': return <Edit3 size={16} />;
    case 'email': return <Mail size={16} />;
    case 'url': return <LinkIcon size={16} />;
    case 'color': return <Palette size={16} />;
    case 'number': return <BarChart3 size={16} />;
    case 'boolean': return <ToggleIcon size={16} />;
    case 'textarea': return <TextAreaIcon size={16} />;
    case 'image': return <ImageIcon size={16} />;
    case 'select': return <Layers size={16} />;
    case 'list': return <Layout size={16} />;
    default: return <Edit3 size={16} />;
  }
}

/* ============================================================================
   ICONES SUPPLÉMENTAIRES
   ============================================================================ */

function LinkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-.54-7.54L14 3h-.5" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 .54 7.54L10 21h.5" />
    </svg>
  );
}

function ToggleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="11" width="18" height="10" rx="2" ry="2" />
      <path d="M8 11h.01" />
    </svg>
  );
}

function TextAreaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 15 21 6 15 6" />
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v16" />
    </svg>
  );
}