import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Pencil, Eye, Loader2, Save, CheckCircle, XCircle, Folder, Check, ClipboardList, Image, BarChart2 } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import * as z from 'zod';

// Schéma de validation pour les documents
const documentSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire'),
  description: z.string().optional(),
  document_type: z.enum([
    'justificatif_depense',
    'justificatif_revenu',
    'contrat',
    'facture',
    'recu',
    'autorisation',
    'certificat',
    'plan',
    'rapport',
    'photo',
    'autre'
  ]),
  file_url: z.string().url('URL du fichier invalide'),
  file_name: z.string().min(1, 'Le nom du fichier est obligatoire'),
  file_size: z.number().nonnegative('La taille du fichier doit être positive'),
  mime_type: z.string(),
  upload_date: z.date(),
  related_entity_type: z.enum(['animal', 'plot', 'campaign', 'cash_transaction', 'none']).default('none'),
  related_entity_id: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  is_public: z.boolean().default(false),
});

interface DocumentFormValues {
  title: string;
  description?: string;
  document_type:
    | 'justificatif_depense'
    | 'justificatif_revenu'
    | 'contrat'
    | 'facture'
    | 'recu'
    | 'autorisation'
    | 'certificat'
    | 'plan'
    | 'rapport'
    | 'photo'
    | 'autre';
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_date: Date;
  related_entity_type: 'animal' | 'plot' | 'campaign' | 'cash_transaction' | 'none';
  related_entity_id?: string;
  tags: string[];
  is_public: boolean;
}

export function DocumentManage() {
  const { documents, animals, plots, campaigns, cashTransactions, refresh } = useData() as any;
  const { appUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<any>(null);
  const [detailDocument, setDetailDocument] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { values: form, setFieldValue: setForm, errors } = useValidatedForm({
    schema: documentSchema,
    defaultValues: {
      title: '',
      description: '',
      document_type: 'facture',
      file_url: '',
      file_name: '',
      file_size: 0,
      mime_type: '',
      upload_date: new Date(),
      related_entity_type: 'none',
      related_entity_id: undefined,
      tags: [],
      is_public: false,
    },
    onSubmit: async () => {
      // Fonction factice pour satisfaire TypeScript
      // La vraie logique de soumission est dans handleSubmit ci-dessous
    }
  });

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];

    let filtered = [...documents];

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((d: any) =>
        d.title.toLowerCase().includes(term) ||
        (d.description || '').toLowerCase().includes(term) ||
        d.file_name.toLowerCase().includes(term) ||
        d.document_type.toString().includes(term) ||
        d.tags.some((tag: string) => tag.toLowerCase().includes(term))
      );
    }

    // Filtre par type de document
    if (filterType !== 'all') {
      filtered = filtered.filter((d: any) => d.document_type === filterType);
    }

    // Filtre par entité liée
    if (filterEntity !== 'all') {
      filtered = filtered.filter((d: any) => d.related_entity_type === filterEntity);
    }

    return filtered;
  }, [documents, searchTerm, filterType, filterEntity]);

  const kpis = useMemo(() => {
    if (!documents) return { totalDocuments: 0, totalSize: 0, publicDocuments: 0, byType: {} };

    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum: any, d: any) => sum + d.file_size, 0);
    const publicDocuments = documents.filter((d: any) => d.is_public).length;

    // Comptage par type
    const byType: Record<string, number> = {};
    documents.forEach((doc: any) => {
      byType[doc.document_type] = (byType[doc.document_type] || 0) + 1;
    });

    return { totalDocuments, totalSize, publicDocuments, byType };
  }, [documents]);

  const openCreate = () => {
    setEditDocument(null);
    setForm('title', '');
    setForm('description', '');
    setForm('document_type', 'facture');
    setForm('file_url', '');
    setForm('file_name', '');
    setForm('file_size', 0);
    setForm('mime_type', '');
    setForm('upload_date', new Date());
    setForm('related_entity_type', 'none');
    setForm('related_entity_id', undefined);
    setForm('tags', []);
    setForm('is_public', false);
    setModalOpen(true);
  };

  const openEdit = (document: any) => {
    setEditDocument(document);
    setForm('title', document.title);
    setForm('description', document.description || '');
    setForm('document_type', document.document_type);
    setForm('file_url', document.file_url);
    setForm('file_name', document.file_name);
    setForm('file_size', document.file_size);
    setForm('mime_type', document.mime_type);
    setForm('upload_date', document.upload_date ? new Date(document.upload_date) : new Date());
    setForm('related_entity_type', document.related_entity_type || 'none');
    setForm('related_entity_id', document.related_entity_id || undefined);
    setForm('tags', document.tags || []);
    setForm('is_public', document.is_public || false);
    setDetailDocument(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    // Validation avec Zod
    const validationResult = documentSchema.safeParse(form);
    if (!validationResult.success) {
      // Afficher la première erreur pour simplicité
      const firstError = validationResult.error.issues[0];
      toast.show(`${String(firstError.path[0])}: ${firstError.message}`, 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        document_type: form.document_type,
        file_url: form.file_url,
        file_name: form.file_name,
        file_size: form.file_size,
        mime_type: form.mime_type,
        upload_date: form.upload_date.toISOString().split('T')[0],
        related_entity_type: form.related_entity_type,
        related_entity_id: form.related_entity_id || null,
        tags: form.tags,
        is_public: form.is_public,
      };

      if (editDocument) {
        const { error } = await supabase.from('documents').update(payload).eq('id', editDocument.id);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'UPDATE', 'document', editDocument.title, `Document ${editDocument.title} modifié`);
          toast.show('Document modifié');
          setModalOpen(false);
          refresh();
        }
      } else {
        const { error } = await supabase.from('documents').insert(payload);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'CREATE', 'document', payload.title, `Création du document ${payload.title}`);
          toast.show('Document créé avec succès');
          setModalOpen(false);
          refresh();
        }
      }
    } catch (error) {
      toast.show('Erreur inattendue: ' + (error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('documents').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'document', confirmDelete.title, `Document ${confirmDelete.title} supprimé`);
      toast.show('Document supprimé');
      setConfirmDelete(null);
      setDetailDocument(null);
      refresh();
    }
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'justificatif_depense': 'Justificatif de dépense',
      'justificatif_revenu': 'Justificatif de revenu',
      'contrat': 'Contrat',
      'facture': 'Facture',
      'recu': 'Reçu',
      'autorisation': 'Autorisation',
      'certificat': 'Certificat',
      'plan': 'Plan',
      'rapport': 'Rapport',
      'photo': 'Photo',
      'autre': 'Autre'
    };
    return labels[type] || type;
  };

  const getFileIcon = (mimeType: string): any => {
    if (mimeType.startsWith('image/')) return <Image size={20} />;
    if (mimeType === 'application/pdf') return <FileText size={20} />;
    if (mimeType.startsWith('text/')) return <ClipboardList size={20} />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <BarChart2 size={20} />;
    return <FileText size={20} />;
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestion des documents"
        subtitle="Stockage et organisation des documents de l'exploitation"
        actions={
          <>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              <Plus size={18} /> Nouveau document
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total documents" value={String(kpis.totalDocuments)} icon={<Folder size={20} />} color="blue" />
        <KpiCard label="Espace utilisé" value={`${(kpis.totalSize / 1024 / 1024).toFixed(2)} Mo`} icon={<CheckCircle size={20} />} color="green" />
        <KpiCard label="Documents publics" value={String(kpis.publicDocuments)} icon={<Check size={20} />} color="amber" />
        <KpiCard label="Types de documents" value={String(Object.keys(kpis.byType).length)} icon={<BarChart2 size={20} />} color="blue" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Rechercher</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
            placeholder="Rechercher par titre, description, nom de fichier, tags..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type de document</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="all">Tous les types</option>
            <option value="justificatif_depense">Justificatif de dépense</option>
            <option value="justificatif_revenu">Justificatif de revenu</option>
            <option value="contrat">Contrat</option>
            <option value="facture">Facture</option>
            <option value="recu">Reçu</option>
            <option value="autorisation">Autorisation</option>
            <option value="certificat">Certificat</option>
            <option value="plan">Plan</option>
            <option value="rapport">Rapport</option>
            <option value="photo">Photo</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Entité liée</label>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="all">Toutes les entités</option>
            <option value="none">Aucune</option>
            <option value="animal">Animal</option>
            <option value="plot">Parcelle</option>
            <option value="campaign">Campagne</option>
            <option value="cash_transaction">Mouvement de trésorerie</option>
          </select>
        </div>
        <div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterEntity('all');
            }}
            className="w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {(!documents || documents.length === 0) ? (
        <EmptyState
          icon={<Folder size={48} />}
          title={searchTerm ? "Aucun résultat" : "Aucun document"}
          message={searchTerm ? "Aucun document ne correspond à votre recherche" : "Aucun document enregistré"}
          action={searchTerm ? undefined : <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"><Plus size={16} /> Nouveau document</button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Titre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nom du fichier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Taille</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date d'upload</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Entité liée</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Accès</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDocuments.map((document: any) => (
                <tr key={document.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600">{document.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getDocumentTypeLabel(document.document_type)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{document.file_name}</td>
                  <td className="px-4 py-3 text-sm text-right">{document.file_size >= 1024 * 1024 ? (document.file_size / 1024 / 1024).toFixed(2) + ' Mo' : document.file_size >= 1024 ? (document.file_size / 1024).toFixed(2) + ' Ko' : document.file_size + ' o'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(document.upload_date)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {document.related_entity_type === 'none' ? 'Aucune' :
                      document.related_entity_type === 'animal' ? `Animal #${document.related_entity_id}` :
                      document.related_entity_type === 'plot' ? `Parcelle #${document.related_entity_id}` :
                      document.related_entity_type === 'campaign' ? `Campagne #${document.related_entity_id}` :
                      `Mvt trésorerie #${document.related_entity_id}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <SimpleBadge color={document.is_public ? 'green' : 'gray'}>
                      {document.is_public ? 'Public' : 'Privé'}
                    </SimpleBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!detailDocument && !confirmDelete}
        onClose={() => setDetailDocument(null)}
        title={`Document : ${detailDocument?.title || ''}`}
        size="lg"
        footer={
          detailDocument ? (
            <>
              <button onClick={() => setConfirmDelete(detailDocument)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => openEdit(detailDocument)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
            </>
          ) : undefined
        }
      >
        {detailDocument && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{detailDocument.title}</h2>
                <p className="text-sm text-slate-500">{detailDocument.description || '—'}</p>
              </div>
              <SimpleBadge color={
                detailDocument.is_public ? 'green' : 'gray'
              }>
                {detailDocument.is_public ? 'Public' : 'Privé'}
              </SimpleBadge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400">Titre</p><p className="text-sm font-medium">{detailDocument.title}</p></div>
              <div><p className="text-xs text-slate-400">Description</p><p className="text-sm font-medium">{detailDocument.description || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Type de document</p><p className="text-sm font-medium">{getDocumentTypeLabel(detailDocument.document_type)}</p></div>
              <div><p className="text-xs text-slate-400">Nom du fichier</p><p className="text-sm font-medium">{detailDocument.file_name}</p></div>
              <div><p className="text-xs text-slate-400">Taille du fichier</p><p className="text-sm font-medium">{detailDocument.file_size >= 1024 * 1024 ? (detailDocument.file_size / 1024 / 1024).toFixed(2) + ' Mo' : detailDocument.file_size >= 1024 ? (detailDocument.file_size / 1024).toFixed(2) + ' Ko' : detailDocument.file_size + ' o'}</p></div>
              <div><p className="text-xs text-slate-400">Type MIME</p><p className="text-sm font-medium">{detailDocument.mime_type}</p></div>
              <div><p className="text-xs text-slate-400">Date d'upload</p><p className="text-sm font-medium">{formatDate(detailDocument.upload_date)}</p></div>
              <div><p className="text-xs text-slate-400">URL du fichier</p><p className="text-sm font-medium break-all">{detailDocument.file_url}</p></div>
              <div><p className="text-xs text-slate-400">Entité liée</p><p className="text-sm font-medium">
                {detailDocument.related_entity_type === 'none' ? 'Aucune' :
                  detailDocument.related_entity_type === 'animal' ? `Animal #${detailDocument.related_entity_id}` :
                  detailDocument.related_entity_type === 'plot' ? `Parcelle #${detailDocument.related_entity_id}` :
                  detailDocument.related_entity_type === 'campaign' ? `Campagne #${detailDocument.related_entity_id}` :
                  `Mvt trésorerie #${detailDocument.related_entity_id}`}
              </p></div>
              <div><p className="text-xs text-slate-400">Tags</p><p className="text-sm font-medium">{detailDocument.tags.length > 0 ? detailDocument.tags.join(', ') : 'Aucun'}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editDocument ? 'Modifier le document' : 'Nouveau document'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editDocument ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Titre *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm('title', e.target.value)}
              className={`form-input ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Facture d'achat d'aliment, contrat de travail, etc."
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description (optionnel)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm('description', e.target.value)}
              className="form-input"
              rows={3}
              placeholder="Informations complémentaires sur le document..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type de document *</label>
            <select
              value={form.document_type}
              onChange={(e) => setForm('document_type', e.target.value as any)}
              className="form-input"
            >
              <option value="justificatif_depense">Justificatif de dépense</option>
              <option value="justificatif_revenu">Justificatif de revenu</option>
              <option value="contrat">Contrat</option>
              <option value="facture">Facture</option>
              <option value="recu">Reçu</option>
              <option value="autorisation">Autorisation</option>
              <option value="certificat">Certificat</option>
              <option value="plan">Plan</option>
              <option value="rapport">Rapport</option>
              <option value="photo">Photo</option>
              <option value="autre">Autre</option>
            </select>
            {errors.document_type && (
              <p className="mt-1 text-xs text-red-500">{errors.document_type}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom du fichier *</label>
            <input
              type="text"
              value={form.file_name}
              onChange={(e) => setForm('file_name', e.target.value)}
              className={`form-input ${errors.file_name ? 'border-red-500' : ''}`}
              placeholder="facture_achat_aliment_janvier.pdf"
            />
            {errors.file_name && (
              <p className="mt-1 text-xs text-red-500">{errors.file_name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Taille du fichier (octets) *</label>
            <input
              type="number"
              min="0"
              value={form.file_size}
              onChange={(e) => setForm('file_size', parseInt(e.target.value) || 0)}
              className={`form-input ${errors.file_size ? 'border-red-500' : ''}`}
            />
            {errors.file_size && (
              <p className="mt-1 text-xs text-red-500">{errors.file_size}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type MIME *</label>
            <input
              type="text"
              value={form.mime_type}
              onChange={(e) => setForm('mime_type', e.target.value)}
              className={`form-input ${errors.mime_type ? 'border-red-500' : ''}`}
              placeholder="application/pdf, image/jpeg, etc."
            />
            {errors.mime_type && (
              <p className="mt-1 text-xs text-red-500">{errors.mime_type}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">URL du fichier *</label>
            <input
              type="text"
              value={form.file_url}
              onChange={(e) => setForm('file_url', e.target.value)}
              className={`form-input ${errors.file_url ? 'border-red-500' : ''}`}
              placeholder="https://exemple.com/documents/facture.pdf"
            />
            {errors.file_url && (
              <p className="mt-1 text-xs text-red-500">{errors.file_url}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date d'upload</label>
            <input
              type="date"
              value={form.upload_date ? form.upload_date.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setForm('upload_date', new Date(e.target.value));
                }
                // Ignorer les valeurs vides pour maintenir la validité
              }}
              className={`form-input ${errors.upload_date ? 'border-red-500' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Entité liée</label>
            <select
              value={form.related_entity_type}
              onChange={(e) => setForm('related_entity_type', e.target.value as any)}
              className="form-input"
            >
              <option value="none">Aucune</option>
              <option value="animal">Animal</option>
              <option value="plot">Parcelle</option>
              <option value="campaign">Campagne</option>
              <option value="cash_transaction">Mouvement de trésorerie</option>
            </select>
          </div>
          {form.related_entity_type !== 'none' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ID de l'entité liée</label>
                <input
                  type="text"
                  value={form.related_entity_id || ''}
                  onChange={(e) => setForm('related_entity_id', e.target.value)}
                  className="form-input"
                  placeholder="UUID de l'entité liée"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={form.tags.join(',')}
              onChange={(e) => setForm('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0))}
              className="form-input"
              placeholder="facture, aliment, janvier, 2026"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Document public</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm('is_public', e.target.checked)}
                className="h-4 w-4 text-green-600"
              />
              <span className="ml-2 text-sm">Rendre ce document accessible publiquement</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer le document « {confirmDelete?.title} » ({confirmDelete?.file_name}) ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}

// Extrait les erreurs du hook useValidatedForm pour une utilisation plus simple dans ce composant
function extractErrors<T>(result: any): Partial<Record<keyof T, string>> {
  // Cette fonction serait normalement fournie par le hook useValidatedForm
  // Pour cet exemple, on retourne un objet vide
  return {};
}