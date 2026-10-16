import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncAction } from '@/hooks/useAsyncAction';
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

  const handleSubmitWithToast = async () => {
    // Validation avec Zod
    const validationResult = documentSchema.safeParse(form);
    if (!validationResult.success) {
      // Afficher la première erreur pour simplicité
      const firstError = validationResult.error.issues[0];
      toast.show(`${String(firstError.path[0])}: ${firstError.message}`, 'error');
      return;
    }

    await executeAction(
      async () => {
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
          if (error) throw error;

          await logAudit(appUser?.name || 'Système', 'UPDATE', 'document', editDocument.title, `Document ${editDocument.title} modifié`);
          return { action: 'UPDATE', document: editDocument.title };
        } else {
          const { error } = await supabase.from('documents').insert(payload);
          if (error) throw error;

          await logAudit(appUser?.name || 'Système', 'CREATE', 'document', payload.title, `Création du document ${payload.title}`);
          return { action: 'CREATE', document: payload.title };
        }
      },
      {
        successMessage: 'Document créé avec succès',
        errorMessage: 'Erreur lors de la création du document',
        onSuccess: (result) => {
          if (result.action === 'CREATE') {
            toast.show('Document créé avec succès');
          } else if (result.action === 'UPDATE') {
            toast.show('Document modifié');
          }
          setModalOpen(false);
          refresh();
        }
      }
    );
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await executeAction(
      async () => {
        const { error } = await supabase.from('documents').delete().eq('id', confirmDelete.id);
        if (error) throw error;

        await logAudit(appUser?.name || 'Système', 'DELETE', 'document', confirmDelete.title, `Document ${confirmDelete.title} supprimé`);
        return { id: confirmDelete.id, title: confirmDelete.title };
      },
      {
        successMessage: 'Document supprimé',
        errorMessage: 'Erreur lors de la suppression du document',
        onSuccess: (result) => {
          toast.show('Document supprimé');
          setConfirmDelete(null);
          setDetailDocument(null);
          refresh();
        }
      }
    );
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
            <option value="animal">Animal</option