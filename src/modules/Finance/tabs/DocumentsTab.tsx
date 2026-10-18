import { useState } from 'react';
import { List, Plus, FileText, Clock } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ValidatedForm } from '@/components/ui/ValidatedForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { z } from 'zod';
import type { Document } from '@/lib/types';
import { useDocuments } from '@/modules/Finance/hooks/useFinanceData';

interface DocumentsTabProps {
  documentsData: ReturnType<typeof useDocuments>;
}

const documentSchema = z.object({
  reference: z.string().min(1, 'Référence obligatoire'),
  type: z.string().min(1, 'Type obligatoire'),
  name: z.string().min(1, 'Nom obligatoire'),
  status: z.string().min(1, 'Statut obligatoire'),
  upload_date: z.string().min(1, 'Date d\'upload obligatoire'),
  uploaded_by: z.string().nullable(),
  comment: z.string().nullable(),
});

interface DocumentFormValues {
  reference: string;
  type: string;
  name: string;
  status: string;
  upload_date: string;
  uploaded_by: string | null;
  comment: string | null;
}

export const DocumentsTab = ({ documentsData }: DocumentsTabProps) => {
  const { data, loading, error, refetch } = documentsData;
  const { authUser, appUser } = useAuth();
  const { executeAction, loading: actionLoading } = useAsyncAction();
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const currentUploader = appUser?.name ?? authUser?.email ?? 'Utilisateur inconnu';

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

        const { error: insertError } = await supabase
          .from('documents')
          .insert([{
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
          }]);
        if (insertError) throw insertError;
      }, {
        successMessage: 'Document créé avec succès',
        errorMessage: 'Échec de la création du document',
        onSuccess: () => {
          setModalOpen(false);
          refetch();
        },
      });
    },
  });

  const handleManageDocument = () => {
    form.resetForm();
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    if (!file) return null;
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
        <KpiCard label="Total Documents" value={String(total)} icon={<List size={20} />} trend={0} />
        <KpiCard label="Documents ce mois" value={String(ceMois)} icon={<Plus size={20} />} trend={0} />
        <KpiCard label="Vérifiés" value={String(verifies)} icon={<FileText size={20} />} trend={0} />
        <KpiCard label="En attente" value={String(enAttente)} icon={<Clock size={20} />} trend={0} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleManageDocument}
          disabled={actionLoading || form.isSubmitting}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {actionLoading || form.isSubmitting ? 'Chargement...' : 'Gérer document'}
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'upload_date', label: 'Date Upload', render: (row: Document) => row.upload_date },
          { key: 'reference', label: 'Référence', render: (row: Document) => row.reference ?? '-' },
          { key: 'type', label: 'Type', render: (row: Document) => row.type },
          { key: 'name', label: 'Nom', render: (row: Document) => row.name },
          {
            key: 'file_url',
            label: 'Fichier',
            render: (row: Document) =>
              row.file_url
                ? <a href={row.file_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">📄 Voir</a>
                : '-',
          },
          { key: 'file_size', label: 'Taille', render: (row: Document) => row.file_size != null ? `${row.file_size} o` : '-', align: 'right' },
          { key: 'mime_type', label: 'Type MIME', render: (row: Document) => row.mime_type ?? '-' },
          { key: 'uploaded_by', label: 'Uploadé par', render: (row: Document) => row.uploaded_by ?? '-' },
          { key: 'object_type', label: 'Objet Type', render: (row: Document) => row.object_type ?? '-' },
          { key: 'object_id', label: 'Objet ID', render: (row: Document) => row.object_id ?? '-' },
          { key: 'status', label: 'Statut', render: (row: Document) => row.status },
        ]}
        data={rows}
        rowKey={(row: Document) => row.id}
        searchKeys={(row: Document) => `${row.reference ?? ''} ${row.type} ${row.name} ${row.comment ?? ''}`}
        onRowClick={() => {}}
        pageSize={10}
      />

      {/* Modal DocumentManage — création d'un justificatif */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Gérer un justificatif"
        size="md"
      >
        <form onSubmit={form.handleSubmit} className="space-y-4">
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
              Fichier (PDF, image) *
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
            {uploading && (
              <p className="text-xs text-amber-600 mt-1">Upload en cours…</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Statut *</label>
              <select
                value={form.values.status}
                onChange={(e) => form.setFieldValue('status', e.target.value)}
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
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!form.isValid || form.isSubmitting || uploading}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {uploading ? 'Upload en cours…' : form.isSubmitting ? 'Enregistrement...' : 'Créer le document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
