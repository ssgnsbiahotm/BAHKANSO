import { useState, useMemo, useRef } from 'react';
import { FileText, CheckCircle, XCircle, Eye, Upload, Trash2, Pencil } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit, type Document } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatDate, formatFileSize } from '@/lib/format';
import { DOCUMENT_STATUS_COLORS, DOCUMENT_TYPES } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { KpiCard } from '@/components/ui/KpiCard';

export function Documents() {
  const { documents, expenses, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [detailDoc, setDetailDoc] = useState<Document | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null);
  const [form, setForm] = useState({ type: 'facture', name: '', expense_id: '', comment: '' });

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return documents;
    return documents.filter(d => d.status === statusFilter);
  }, [documents, statusFilter]);

  const kpis = useMemo(() => ({
    total: documents.length,
    verified: documents.filter(d => d.status === 'vérifié').length,
    pending: documents.filter(d => d.status === 'à vérifier').length,
    missing: documents.filter(d => d.status === 'manquant').length,
  }), [documents]);

  const openCreate = () => {
    setEditDoc(null);
    setForm({ type: 'facture', name: '', expense_id: '', comment: '' });
    setSelectedFile(null);
    setPreviewUrl(null);
    setModalOpen(true);
  };

  const openEdit = (doc: Document) => {
    setEditDoc(doc);
    setForm({ type: doc.type, name: doc.name, expense_id: doc.object_id || '', comment: doc.comment || '' });
    setSelectedFile(null);
    setPreviewUrl(doc.file_url);
    setModalOpen(true);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.show('Le fichier ne doit pas dépasser 10 Mo', 'error');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadFile = async (file: File): Promise<{ url: string; size: number; mime: string } | null> => {
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `documents/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('app-assets').upload(fileName, file);
    if (upErr) {
      toast.show('Erreur upload: ' + upErr.message, 'error');
      return null;
    }
    const { data: pub } = supabase.storage.from('app-assets').getPublicUrl(fileName);
    return { url: pub.publicUrl, size: file.size, mime: file.type || 'application/octet-stream' };
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.show('Nom du document obligatoire', 'error');
      return;
    }
    setSaving(true);

    if (editDoc) {
      let fileUrl = editDoc.file_url;
      let fileSize = editDoc.file_size;
      let mimeType = editDoc.mime_type;
      if (selectedFile) {
        setUploading(true);
        const result = await handleUploadFile(selectedFile);
        setUploading(false);
        if (result) {
          fileUrl = result.url;
          fileSize = result.size;
          mimeType = result.mime;
        } else {
          setSaving(false);
          return;
        }
      }
      const { error } = await supabase.from('documents').update({
        type: form.type,
        name: form.name,
        file_url: fileUrl,
        file_size: fileSize,
        mime_type: mimeType,
        object_type: form.expense_id ? 'expense' : null,
        object_id: form.expense_id || null,
        comment: form.comment || null,
      }).eq('id', editDoc.id);
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'document', editDoc.reference, `Document ${editDoc.reference} modifié`);
        toast.show('Document modifié');
        setModalOpen(false);
        refresh();
      }
    } else {
      if (!selectedFile) {
        toast.show('Veuillez sélectionner un fichier', 'error');
        setSaving(false);
        return;
      }
      setUploading(true);
      const result = await handleUploadFile(selectedFile);
      setUploading(false);
      if (!result) {
        setSaving(false);
        return;
      }
      const ref = `DOC-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from('documents').insert({
        reference: ref,
        type: form.type,
        name: form.name,
        file_url: result.url,
        file_size: result.size,
        mime_type: result.mime,
        uploaded_by: appUser?.id || null,
        object_type: form.expense_id ? 'expense' : null,
        object_id: form.expense_id || null,
        status: 'à vérifier',
        comment: form.comment || null,
      });
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'CREATE', 'document', ref, `Document ${ref} ajouté`);
        toast.show('Document ajouté avec succès');
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const updateStatus = async (doc: Document, status: string) => {
    const { error } = await supabase.from('documents').update({
      status,
      verified_date: status === 'vérifié' ? new Date().toISOString() : null,
      verified_by: status === 'vérifié' ? appUser?.id : null,
    }).eq('id', doc.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'VALIDATE', 'document', doc.reference, `Document ${doc.reference} marqué "${status}"`);
      toast.show(`Document ${status === 'vérifié' ? 'vérifié' : status === 'rejeté' ? 'rejeté' : 'mis à jour'}`);
      refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('documents').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'document', confirmDelete.reference, `Document ${confirmDelete.reference} supprimé`);
      toast.show('Document supprimé');
      setConfirmDelete(null);
      setDetailDoc(null);
      refresh();
    }
  };

  const columns: Column<Document>[] = [
    { key: 'reference', label: 'ID', sortable: true, render: d => <span className="font-mono text-xs font-medium text-slate-900">{d.reference}</span> },
    { key: 'name', label: 'Nom', sortable: true, render: d => <span className="flex items-center gap-2"><FileText size={14} className="text-slate-400" />{d.name}</span> },
    { key: 'type', label: 'Type', sortable: true, render: d => <span className="text-xs text-slate-600 capitalize">{d.type}</span> },
    { key: 'file_size', label: 'Taille', render: d => formatFileSize(d.file_size) },
    { key: 'upload_date', label: 'Date', sortable: true, sortValue: d => d.upload_date, render: d => formatDate(d.upload_date) },
    { key: 'status', label: 'Statut', sortable: true, render: d => <StatusBadge status={d.status} colorMap={DOCUMENT_STATUS_COLORS} /> },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Justificatifs"
        subtitle="Gestion des documents et justificatifs"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Upload size={18} /> Ajouter un document
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total documents" value={String(kpis.total)} icon={<FileText size={20} />} color="dark" />
        <KpiCard label="Vérifiés" value={String(kpis.verified)} icon={<CheckCircle size={20} />} color="green" />
        <KpiCard label="À vérifier" value={String(kpis.pending)} icon={<FileText size={20} />} color="amber" />
        <KpiCard label="Manquants" value={String(kpis.missing)} icon={<XCircle size={20} />} color="red" />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'ajouté', 'à vérifier', 'vérifié', 'rejeté', 'manquant'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {s === 'all' ? 'Tous' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={d => d.id}
        searchable
        searchKeys={d => `${d.reference} ${d.name} ${d.type} ${d.status}`}
        onRowClick={d => setDetailDoc(d)}
        actions={(d) => (
          <div className="flex items-center gap-1">
            {d.status === 'à vérifier' && (
              <>
                <button onClick={() => updateStatus(d, 'vérifié')} title="Vérifier" className="p-1.5 text-green-600 hover:bg-green-50 rounded"><CheckCircle size={16} /></button>
                <button onClick={() => updateStatus(d, 'rejeté')} title="Rejeter" className="p-1.5 text-red-600 hover:bg-red-50 rounded"><XCircle size={16} /></button>
              </>
            )}
            <button onClick={() => openEdit(d)} title="Modifier" className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Pencil size={16} /></button>
            <button onClick={() => setConfirmDelete(d)} title="Supprimer" className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
            <button onClick={() => setDetailDoc(d)} title="Voir" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
          </div>
        )}
        pageSize={10}
      />

      {/* Detail modal */}
      <Modal
        open={!!detailDoc && !confirmDelete}
        onClose={() => setDetailDoc(null)}
        title={`Document ${detailDoc?.reference || ''}`}
        size="lg"
        footer={
          detailDoc ? (
            <>
              <button onClick={() => setConfirmDelete(detailDoc)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => { openEdit(detailDoc); setDetailDoc(null); }} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
              {detailDoc.status === 'à vérifier' && (
                <>
                  <button onClick={() => { updateStatus(detailDoc, 'rejeté'); setDetailDoc(null); }} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Rejeter</button>
                  <button onClick={() => { updateStatus(detailDoc, 'vérifié'); setDetailDoc(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Vérifier</button>
                </>
              )}
            </>
          ) : undefined
        }
      >
        {detailDoc && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><FileText size={24} /></div>
                <div>
                  <p className="font-medium text-slate-900">{detailDoc.name}</p>
                  <p className="text-xs text-slate-500">{detailDoc.type} · {formatFileSize(detailDoc.file_size)}</p>
                </div>
              </div>
              <StatusBadge status={detailDoc.status} colorMap={DOCUMENT_STATUS_COLORS} />
            </div>
            {detailDoc.file_url && (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                {detailDoc.mime_type?.startsWith('image/') ? (
                  <img src={detailDoc.file_url} alt={detailDoc.name} className="w-full max-h-64 object-contain bg-slate-50" />
                ) : (
                  <a href={detailDoc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-4 text-sm text-green-600 hover:bg-slate-50">
                    <FileText size={18} /> Ouvrir le fichier
                  </a>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Type" value={detailDoc.type} />
              <DetailItem label="Date d'upload" value={formatDate(detailDoc.upload_date)} />
              <DetailItem label="Vérifié le" value={detailDoc.verified_date ? formatDate(detailDoc.verified_date) : '—'} />
              <DetailItem label="Commentaire" value={detailDoc.comment || '—'} />
            </div>
          </div>
        )}
      </Modal>

      {/* Upload/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editDoc ? 'Modifier le document' : 'Ajouter un document'}
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving || uploading} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving || uploading ? (uploading ? 'Upload...' : 'Enregistrement...') : editDoc ? 'Modifier' : 'Ajouter'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0] || null; handleFileSelect(f); e.target.value = ''; }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors"
            >
              {previewUrl ? (
                <div className="relative">
                  {previewUrl.startsWith('blob:') || previewUrl.startsWith('http') ? (
                    <img src={previewUrl} alt="Aperçu" className="max-h-32 mx-auto rounded-lg" />
                  ) : (
                    <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                  )}
                  <p className="text-sm text-slate-600 mt-2">{selectedFile?.name || editDoc?.name || 'Fichier actuel'}</p>
                  <p className="text-xs text-green-600 mt-1">Cliquer pour {editDoc ? 'remplacer' : 'changer'}</p>
                </div>
              ) : (
                <>
                  <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">Glissez un fichier ici ou cliquez pour parcourir</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — max 10 Mo</p>
                </>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type de document</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="form-input">
              {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom du document *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="form-input" placeholder="Facture fournisseur..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Dépense associée</label>
            <select value={form.expense_id} onChange={e => setForm({...form, expense_id: e.target.value})} className="form-input">
              <option value="">Aucune</option>
              {expenses.map(e => <option key={e.id} value={e.id}>{e.reference} — {e.description}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Commentaire</label>
            <textarea value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} className="form-input" rows={2} />
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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer le document « {confirmDelete?.name} » ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="text-xs text-slate-400 mb-0.5">{label}</p><p className="text-sm font-medium text-slate-900">{value}</p></div>;
}
