import { useState, useMemo, useRef } from 'react';
import { Plus, Search, X, Upload, Image as ImageIcon, Eye, Pencil, Trash2, ChevronDown, Menu, Calendar } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit, type Media } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatDate } from '@/lib/format';
import { MEDIA_TYPES, MEDIA_CATEGORIES } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

const TYPE_COLORS: Record<string, 'blue' | 'green' | 'purple'> = {
  image: 'blue',
  icon: 'green',
  logo: 'purple',
};

function emptyForm() {
  return {
    title: '',
    description: '',
    type: 'image',
    category: '',
  };
}

export function Media() {
  const { media, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Media['type']>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailMedia, setDetailMedia] = useState<Media | null>(null);
  const [editMedia, setEditMedia] = useState<Media | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    let result = media;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q) ||
        m.type.includes(q) ||
        (m.category ?? '').toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') result = result.filter(m => m.type === typeFilter);
    if (categoryFilter) result = result.filter(m => (m.category ?? '') === categoryFilter);
    return result;
  }, [media, search, typeFilter, categoryFilter]);

  const kpis = useMemo(() => {
    const total = media.length;
    const byType = MEDIA_TYPES.reduce((acc, t) => {
      acc[t] = media.filter(m => m.type === t).length;
      return acc;
    }, {} as Record<string, number>);
    return { total, byType };
  }, [media]);

  const openCreate = () => {
    setEditMedia(null);
    setForm(emptyForm());
    setImageUrl(null);
    setModalOpen(true);
  };

  const openEdit = (m: Media) => {
    setEditMedia(m);
    setForm({
      title: m.title,
      description: m.description ?? '',
      type: m.type,
      category: m.category ?? '',
    });
    setImageUrl(m.url);
    setModalOpen(true);
  };

  const handleUploadImage = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.show('L\'image ne doit pas dépasser 5 Mo', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.show('Le fichier doit être une image', 'error');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('app-assets').upload(fileName, file);
    if (upErr) {
      toast.show('Erreur upload: ' + upErr.message, 'error');
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from('app-assets').getPublicUrl(fileName);
    setImageUrl(pub.publicUrl);
    setUploading(false);
    toast.show('Image téléchargée');
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.show('Le titre est obligatoire', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      url: imageUrl,
      type: form.type,
      category: form.category.trim() || null,
      uploaded_by: appUser?.id ?? null,
      updated_at: new Date().toISOString(),
    };
    if (editMedia) {
      const { error } = await supabase.from('media').update(payload).eq('id', editMedia.id);
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'media', editMedia.id, `Média "${form.title}" modifié`);
        toast.show('Média modifié');
        setModalOpen(false);
        refresh();
      }
    } else {
      const { error } = await supabase.from('media').insert({
        ...payload,
        created_at: new Date().toISOString(),
      });
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'CREATE', 'media', null, `Média "${form.title}" créé`);
        toast.show('Média créé avec succès');
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!detailMedia) return;
    const { error } = await supabase.from('media').delete().eq('id', detailMedia.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'media', detailMedia.id, `Média "${detailMedia.title}" supprimé`);
      toast.show('Média supprimé');
      setDetailMedia(null);
      refresh();
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Médias"
        subtitle="Gestion des images, icônes et logos pour le site vitrine et l'application"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus size={18} /> Nouveau média
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total médias" value={String(kpis.total)} icon={<ImageIcon size={20} />} color="blue" />
        {MEDIA_TYPES.map((t) => (
          <KpiCard
            key={t}
            label={t.charAt(0).toUpperCase() + t.slice(1)}
            value={String(kpis.byType[t] || 0)}
            icon={<ImageIcon size={20} />}
            color={TYPE_COLORS[t] || 'blue'}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par titre, description, type ou catégorie..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
        >
          <option value="all">Tous types</option>
          {MEDIA_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
        >
          <option value="">Toutes catégories</option>
          {MEDIA_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ImageIcon size={48} />}
          title={media.length === 0 ? "Aucun média" : "Aucun résultat"}
          message={media.length === 0 ? "Commencez par ajouter votre premier média" : "Essayez de modifier vos filtres de recherche"}
          action={media.length === 0 ? <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"><Plus size={16} /> Ajouter un média</button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="relative w-full h-[200px] bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer" onClick={() => setDetailMedia(m)}>
              <div className="absolute inset-0">
                {m.url ? (
                  <img src={m.url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon size={40} />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 text-xs rounded ${TYPE_COLORS[m.type] || 'gray'} bg-${TYPE_COLORS[m.type] || 'gray'}-20`}>
                    {m.type}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 p-2 text-slate-700 text-center">
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{m.title}</h3>
                  <p className="text-xs line-clamp-2">{m.description ?? '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!detailMedia && !editMedia}
        onClose={() => setDetailMedia(null)}
        title={detailMedia?.title || ''}
        size="lg"
        footer={
          detailMedia ? (
            <>
              <button onClick={() => setEditMedia(detailMedia)} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Modifier</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
            </>
          ) : undefined
        }
      >
        {detailMedia && (
          <div className="space-y-5">
            {detailMedia.url && (
              <div className="rounded-xl overflow-hidden h-60">
                <img src={detailMedia.url} alt={detailMedia.title} className="w-full h-full object-cover" />
              </div>
            )}
            {detailMedia.description && (
              <p className="text-sm text-slate-600">{detailMedia.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-600"><ImageIcon size={14} /> Type: {detailMedia.type}</span>
              {detailMedia.category && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-600">Catégorie: {detailMedia.category}</span>
              )}
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-600"><Calendar size={14} /> Ajouté: {formatDate(detailMedia.created_at)}</span>
              {detailMedia.updated_at && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-600"><Calendar size={14} /> Modifié: {formatDate(detailMedia.updated_at)}</span>
              )}
            </div>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">Créée le {formatDate(detailMedia.created_at)} · Modifiée le {formatDate(detailMedia.updated_at)}</p>
          </div>
        )}
      </Modal>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMedia ? 'Modifier le média' : 'Nouveau média'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving || uploading} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : editMedia ? 'Modifier' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Image du média</label>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={28} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f); e.target.value = ''; }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                >
                  {uploading ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <Upload size={16} />}
                  {uploading ? 'Upload...' : 'Choisir une image'}
                </button>
                {imageUrl && (
                  <button type="button" onClick={() => setImageUrl(null)} className="ml-2 text-xs text-red-500 hover:underline">Retirer l'image</button>
                )}
                <p className="text-xs text-slate-400 mt-1">JPG, PNG — max 5 Mo</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Titre *</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="form-input" placeholder="Logo de l'entreprise" />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="form-input" rows={2} placeholder="Description du média..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="form-input">
                {MEDIA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="form-input">
                {MEDIA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
