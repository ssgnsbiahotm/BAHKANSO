import { useState, useMemo } from 'react';
import { List, Plus, FileText, Clock, Trash2, Edit2, Eye, ExternalLink, Download, File, Image } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { ValidatedForm } from '@/components/ui/ValidatedForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { z } from 'zod';
import type { Document } from '@/lib/types';
import { logAudit } from '@/lib/types';
import { useDocuments } from '@/modules/Finance/hooks/useFinanceData';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { formatDate } from '@/lib/format';

interface DocumentsTabProps {
  documentsData: ReturnType<typeof useDocuments>;
}

const documentSchema = z.object({
  reference: z.string().min(1, 'Référence obligatoire'),
  type: z.string().min(1, 'Type obligatoire'),
  name: z.string().min(1, 'Nom obligatoire'),
  status: z.enum(['manquant', 'ajouté', 'à vérifier', 'vérifié', 'rejeté']),
  upload_date: z.string().min(1, 'Date d\'upload obligatoire'),
  uploaded_by: z.string().nullable(),
  comment: z.string().nullable(),
});

interface DocumentFormValues {
  reference: string;
  type: string;
  name: string;
  status: 'manquant' | 'ajouté' | 'à vérifier' | 'vérifié' | 'rejeté';
  upload_date: string;
  uploaded_by: string | null;
  comment: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  manquant: 'Manquant',
  ajouté: 'Ajouté',
  'à vérifier': 'À vérifier',
  vérifié: 'Vérifié',
  rejeté: 'Rejeté',
};

const STATUS_COLORS: Record<string, string> = {
  manquant: 'text-red-700 bg-red-50',
  ajouté: 'text-blue-700 bg-blue-50',
  'à vérifier': 'text-amber-700 bg-amber-50',
  vérifié: 'text-green-700 bg-green-50',
  rejeté: 'text-slate-700 bg-slate-100',
};

const getFileIcon = (mimeType: string | null | undefined) => {
  if (!mimeType) return FileText;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  return File;
};

const formatFileSize = (bytes: number | null | undefined) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
};

const DocumentCardFront = ({ document, onEdit, onDelete, onView }: {
  document: Document;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) => {
  const status = document.status || 'ajouté';
  const FileIcon = getFileIcon(document.mime_type);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', paddingBottom: '3rem' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{document.name}</p>
          <p className="text-xs text-slate-500 truncate">{document.reference ?? '—'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} flex-shrink-0`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <FileIcon size={12} />
          <span>{document.type}</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-700">{formatFileSize(document.file_size)}</p>
          <p className="text-xs text-slate-500">{formatDate(document.upload_date)}</p>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-none">
        <button
          onClick={onView}
          className="pointer-events-auto text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-slate-50 rounded border border-slate-200"
          aria-label="Voir les détails"
        >
          <Eye size={12} /> Détail
        </button>
        <div className="flex items-center gap-1 pointer-events-auto">
          {document.file_url && (
            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-green-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-green-50 rounded border border-slate-200"
              aria-label="Télécharger"
            >
              <Download size={12} />
            </a>
          )}
          <button
            onClick={onEdit}
            className="text-xs text-slate-500 hover:text-green-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-green-50 rounded border border-slate-200"
            aria-label="Modifier"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-slate-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-red-50 rounded border border-slate-200"
            aria-label="Supprimer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentCardBack = ({ document, onClose }: { document: Document; onClose: () => void }) => {
  const status = document.status || 'ajouté';
  const FileIcon = getFileIcon(document.mime_type);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', paddingBottom: '3rem', overflow: 'auto' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{document.name}</h3>
          <p className="text-xs text-slate-500">{document.reference ?? '—'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} flex-shrink-0`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500">Type</p>
          <p className="font-medium capitalize">{document.type}</p>
        </div>
        <div>
          <p className="text-slate-500">Statut</p>
          <p className="font-medium capitalize">{STATUS_LABELS[status] ?? status}</p>
        </div>
        <div>
          <p className="text-slate-500">Fichier</p>
          <p className="font-medium">{document.mime_type ?? '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">Taille</p>
          <p className="font-medium">{formatFileSize(document.file_size)}</p>
        </div>
        <div>
          <p className="text-slate-500">Date upload</p>
          <p className="font-medium">{formatDate(document.upload_date)}</p>
        </div>
        <div>
          <p className="text-slate-500">Uploadé par</p>
          <p className="font-medium">{document.uploaded_by ?? '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">Objet</p>
          <p className="font-medium">{document.object_type ?? '—'} #{document.object_id ?? '—'}</p>
        </div>
      </div>
      {document.comment && (
        <div>
          <p className="text-slate-500 text-sm">Commentaire</p>
          <p className="text-sm">{document.comment}</p>
        </div>
      )}
      {document.file_url && (
        <div>
          <p className="text-slate-500 text-sm">Fichier</p>
          <a href={document.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 hover:underline flex items-center gap-1">
            <ExternalLink size={12} /> Ouvrir le fichier
          </a>
        </div>
      )}
      <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Retour
        </button>
      </div>
    </div>
  );
};

const CreateDocumentCard = ({ onCreate }: { onCreate: () => void }) => (
  <div className="rc" style={{ minHeight: '180px' }}>
    <div className="rc-inner" style={{ transform: 'none' }}>
      <div className="rc-face rc-face--front" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '1rem', padding: '2rem', border: '2px dashed #CBD5E1', background: '#FAFAFA',
        transform: 'rotateY(0deg)', backfaceVisibility: 'hidden'
      }}>
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
          <Plus size={28} className="text-blue-600" />
        </div>
        <div className="text-center">
          <h4 className="font-semibold text-slate-900">Nouveau document</h4>
          <p className="text-sm text-slate-500">Ajouter un justificatif ou document</p>
        </div>
        <button
          onClick={onCreate}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Créer un document
        </button>
      </div>
    </div>
  </div>
);

export const DocumentsTab = ({ documentsData }: DocumentsTabProps) => {
  const { data, loading, error, refetch } = documentsData;
  const { authUser, appUser } = useAuth();
  const isAuthorized = useMemo(() => {
    if (!appUser) return false;
    const role = appUser.role;
    return role === 'administrateur' || role === 'propriétaire' || role === 'proprietaire' || role === 'admin' || role === 'owner';
  }, [appUser]);
  const { executeAction, loading: actionLoading } = useAsyncAction();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const currentUploader = appUser?.name ?? authUser?.email ?? 'Utilisateur inconnu';

  const handleFileUpload = async (file: File): Promise<string | null> => {
    if (!file) return null;
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

    if (file.size > MAX_SIZE) {
      setUploadError(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : 5 MB.`);
      return null;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, PDF.');
      return null;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('app-assets')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload échoué:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const form = ValidatedForm<DocumentFormValues>({
    schema: documentSchema,
    defaultValues: {
      reference: '',
      type: '',
      name: '',
      status: 'ajouté',
      upload_date: new Date().toISOString().slice(0, 16),
      uploaded_by: currentUploader,
      comment: null,
    },
    onSubmit: async (values) => {
      await executeAction(async () => {
        let fileUrl: string | null = null;
        let fileSize: number | null = null;
        let mimeType: string | null = null;

        if (selectedFile) {
          fileUrl = await handleFileUpload(selectedFile);
          if (!fileUrl) {
            throw new Error('Échec de l\'upload du fichier');
          }
          fileSize = selectedFile.size;
          mimeType = selectedFile.type;
        }

        const documentData = {
          reference: values.reference,
          type: values.type,
          name: values.name,
          file_url: fileUrl,
          file_size: fileSize,
          mime_type: mimeType,
          status: values.status,
          upload_date: values.upload_date,
          uploaded_by: values.uploaded_by,
          comment: values.comment,
          object_type: null,
        object_id: null,
        };
        let createdId: string | null = editingDocument?.id ?? null;

        if (editingDocument) {
          const { error: updateError } = await supabase
            .from('documents')
            .update(documentData)
            .eq('id', editingDocument.id);
          if (updateError) throw updateError;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('documents')
            .insert([documentData])
            .select('id')
            .single();
          if (insertError) throw insertError;
          createdId = (inserted as { id: string })?.id ?? null;
        }

        await logAudit(
          appUser?.name || 'Système',
          editingDocument ? 'UPDATE' : 'CREATE',
          'document',
          createdId,
          `${editingDocument ? 'Modification' : 'Création'} du document "${values.name}"`,
          editingDocument ? { ...editingDocument } : null,
          documentData,
        );
      }, {
        successMessage: editingDocument ? 'Document mis à jour' : 'Document créé avec succès',
        errorMessage: editingDocument ? 'Échec de la mise à jour' : 'Échec de la création',
        onSuccess: () => {
          setModalOpen(false);
          setEditingDocument(null);
          setSelectedFile(null);
          setUploadError(null);
          refetch();
        },
      });
    },
  });

  const handleNewDocument = () => {
    if (!isAuthorized) return;
    form.resetForm();
    setEditingDocument(null);
    setSelectedFile(null);
    setUploadError(null);
    setModalOpen(true);
  };

  const handleEdit = (document: Document) => {
    if (!isAuthorized) return;
    form.setFieldValues({
      reference: document.reference ?? '',
      type: document.type,
      name: document.name,
      status: (document.status ?? 'ajouté') as DocumentFormValues['status'],
      upload_date: document.upload_date ? document.upload_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
      uploaded_by: document.uploaded_by ?? currentUploader,
      comment: document.comment ?? null,
    });
    setEditingDocument(document);
    setSelectedFile(null);
    setUploadError(null);
    setModalOpen(true);
  };

  const handleDelete = (document: Document) => {
    if (!isAuthorized) return;
    setDeletingDocument(document);
  };

  const confirmDelete = async () => {
    if (!deletingDocument) return;
    if (!isAuthorized) {
      setDeletingDocument(null);
      return;
    }
    await executeAction(async () => {
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', deletingDocument.id);
      if (deleteError) throw deleteError;

      await logAudit(
        appUser?.name || 'Système',
        'DELETE',
        'document',
        deletingDocument.id,
        `Suppression du document "${deletingDocument.name}"`,
        { ...deletingDocument },
        null,
      );
    }, {
      successMessage: 'Document supprimé',
      errorMessage: 'Échec de la suppression',
      onSuccess: () => {
        setDeletingDocument(null);
        refetch();
      },
    });
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Erreur lors du chargement des données</div>;

  const rows = data ?? [];

  const total = rows.length;
  const ceMois = rows.filter(d => new Date(d.upload_date).getMonth() === new Date().getMonth()).length;
  const verifies = rows.filter(d => d.status === 'vérifié').length;
  const enAttente = rows.filter(d => d.status === 'à vérifier').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Documents" value={String(total)} icon={<List size={20} />} />
        <KpiCard label="Documents ce mois" value={String(ceMois)} icon={<Plus size={20} />} />
        <KpiCard label="Vérifiés" value={String(verifies)} icon={<FileText size={20} />} />
        <KpiCard label="En attente" value={String(enAttente)} icon={<Clock size={20} />} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNewDocument}
          disabled={actionLoading || form.isSubmitting || uploading || !isAuthorized}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} /> Nouveau document
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ minHeight: '200px' }}>
        {rows.map((document) => (
          <RotatingCard
            key={document.id}
            flipLabel={`Détail — ${document.name}`}
            backLabel="Retour"
            front={<DocumentCardFront document={document} onEdit={() => handleEdit(document)} onDelete={() => handleDelete(document)} onView={() => handleEdit(document)} />}
            back={<DocumentCardBack document={document} onClose={() => {}} />}
          />
        ))}
        <CreateDocumentCard onCreate={handleNewDocument} />
      </div>

      {rows.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <FileText size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">Aucun document</p>
          <p className="text-sm">Cliquez sur « Nouveau document » pour commencer</p>
        </div>
      )}

      {/* Modal création/édition */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingDocument(null); setSelectedFile(null); setUploadError(null); }}
        title={editingDocument ? 'Modifier le document' : 'Nouveau document'}
        size="lg"
      >
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Référence *</label>
              <input
                type="text"
                value={form.values.reference}
                onChange={(e) => form.setFieldValue('reference', e.target.value)}
                className="form-input w-full"
                placeholder="DOC-2024-0001"
              />
              {form.errors.reference && <p className="text-xs text-red-500 mt-1">{form.errors.reference}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
              <input
                type="text"
                value={form.values.type}
                onChange={(e) => form.setFieldValue('type', e.target.value)}
                className="form-input w-full"
                placeholder="facture, reçu, contrat…"
              />
              {form.errors.type && <p className="text-xs text-red-500 mt-1">{form.errors.type}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
            <input
              type="text"
              value={form.values.name}
              onChange={(e) => form.setFieldValue('name', e.target.value)}
              className="form-input w-full"
            />
            {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Fichier (PDF, image) {editingDocument ? '(laisser vide pour conserver)' : '*'}
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="form-input w-full"
              disabled={uploading}
            />
           {selectedFile && (
             <p className="text-xs text-slate-500 mt-1">
               {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} Ko)
             </p>
           )}
           {editingDocument && !selectedFile && editingDocument.file_url && (
             <p className="text-xs text-slate-500 mt-1">Fichier actuel conservé</p>
           )}
           {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
           {uploading && (
             <p className="text-xs text-amber-600 mt-1">Upload en cours…</p>
           )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Statut *</label>
              <select
                value={form.values.status}
                onChange={(e) => form.setFieldValue('status', e.target.value as DocumentFormValues['status'])}
                className="form-input w-full"
              >
                <option value="manquant">Manquant</option>
                <option value="ajouté">Ajouté</option>
                <option value="à vérifier">À vérifier</option>
                <option value="vérifié">Vérifié</option>
                <option value="rejeté">Rejeté</option>
              </select>
              {form.errors.status && <p className="text-xs text-red-500 mt-1">{form.errors.status}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date d'upload *</label>
              <input
                type="datetime-local"
                value={form.values.upload_date}
                onChange={(e) => form.setFieldValue('upload_date', e.target.value)}
                className="form-input w-full"
              />
              {form.errors.upload_date && <p className="text-xs text-red-500 mt-1">{form.errors.upload_date}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Uploadé par</label>
            <input
              type="text"
              value={currentUploader}
              readOnly
              disabled
              className="form-input w-full bg-slate-100 cursor-not-allowed text-slate-600"
              title="Déterminé automatiquement depuis votre session"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Commentaire</label>
            <input
              type="text"
              value={form.values.comment ?? ''}
              onChange={(e) => form.setFieldValue('comment', e.target.value || null)}
              className="form-input w-full"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingDocument(null); setSelectedFile(null); setUploadError(null); }}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!form.isValid || form.isSubmitting || uploading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Upload en cours…' : form.isSubmitting ? 'Enregistrement...' : (editingDocument ? 'Mettre à jour' : 'Créer le document')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmation suppression */}
      {deletingDocument && (
        <Modal
          open={true}
          onClose={() => setDeletingDocument(null)}
          title="Confirmer la suppression"
          size="sm"
        >
          <p className="text-sm text-slate-600 mb-4">
            Supprimer le document <strong>{deletingDocument.name}</strong> ({deletingDocument.reference ?? '—'}) ?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeletingDocument(null)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              disabled={actionLoading}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
