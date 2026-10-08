import { useState, useMemo, useRef } from 'react';
import { Plus, Search, Clock, Users as ServingsIcon, ChefHat, Trash2, Pencil, Eye, X, Upload, Image as ImageIcon, UtensilsCrossed } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit, type Recipe, type RecipeIngredient } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatDate } from '@/lib/format';
import { RECIPE_CATEGORIES, RECIPE_DIFFICULTIES, RECIPE_STATUSES, RECIPE_STATUS_COLORS } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { RotatingCard } from '@/components/ui/RotatingCard';

const DIFFICULTY_COLORS: Record<string, string> = {
  facile: 'green',
  moyen: 'amber',
  difficile: 'red',
};

function emptyForm() {
  return {
    title: '',
    description: '',
    category: 'Plat principal',
    prep_time_minutes: '15',
    cook_time_minutes: '30',
    servings: '4',
    difficulty: 'facile',
    status: 'brouillon',
  };
}

export function Recipes() {
  const { recipes, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([{ name: '', quantity: '', unit: '' }]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [form, setForm] = useState(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<Recipe | null>(null);

  const filtered = useMemo(() => {
    let result = recipes;
    if (categoryFilter !== 'all') result = result.filter(r => r.category === categoryFilter);
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.ingredients?.some(i => i.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [recipes, categoryFilter, statusFilter, search]);

  const kpis = useMemo(() => ({
    total: recipes.length,
    published: recipes.filter(r => r.status === 'publiée').length,
    draft: recipes.filter(r => r.status === 'brouillon').length,
    totalIngredients: recipes.reduce((s, r) => s + (r.ingredients?.length || 0), 0),
  }), [recipes]);

  const openCreate = () => {
    setEditRecipe(null);
    setForm(emptyForm());
    setIngredients([{ name: '', quantity: '', unit: '' }]);
    setSteps(['']);
    setImageUrl(null);
    setModalOpen(true);
  };

  const openEdit = (r: Recipe) => {
    setEditRecipe(r);
    setForm({
      title: r.title,
      description: r.description || '',
      category: r.category || 'Plat principal',
      prep_time_minutes: String(r.prep_time_minutes || 0),
      cook_time_minutes: String(r.cook_time_minutes || 0),
      servings: String(r.servings || 1),
      difficulty: r.difficulty || 'facile',
      status: r.status || 'brouillon',
    });
    setIngredients(r.ingredients?.length ? r.ingredients : [{ name: '', quantity: '', unit: '' }]);
    setSteps(r.steps?.length ? r.steps : ['']);
    setImageUrl(r.image_url);
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
    const fileName = `recipes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
    const validIngredients = ingredients.filter(i => i.name.trim());
    const validSteps = steps.filter(s => s.trim());
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      image_url: imageUrl,
      category: form.category,
      ingredients: validIngredients,
      steps: validSteps,
      prep_time_minutes: parseInt(form.prep_time_minutes) || 0,
      cook_time_minutes: parseInt(form.cook_time_minutes) || 0,
      servings: parseInt(form.servings) || 1,
      difficulty: form.difficulty,
      status: form.status,
      updated_at: new Date().toISOString(),
    };
    if (editRecipe) {
      const { error } = await supabase.from('recipes').update(payload).eq('id', editRecipe.id);
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'recipe', editRecipe.id, `Recette "${form.title}" modifiée`);
        toast.show('Recette modifiée');
        setModalOpen(false);
        refresh();
      }
    } else {
      const { error } = await supabase.from('recipes').insert({
        ...payload,
        author_id: appUser?.id || null,
      });
      if (error) {
        toast.show('Erreur: ' + error.message, 'error');
      } else {
        await logAudit(appUser?.name || 'Système', 'CREATE', 'recipe', null, `Recette "${form.title}" créée`);
        toast.show('Recette créée avec succès');
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('recipes').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'recipe', confirmDelete.id, `Recette "${confirmDelete.title}" supprimée`);
      toast.show('Recette supprimée');
      setConfirmDelete(null);
      setDetailRecipe(null);
      refresh();
    }
  };

  const addIngredient = () => setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  const updateIngredient = (i: number, field: keyof RecipeIngredient, value: string) => {
    const arr = [...ingredients];
    arr[i] = { ...arr[i], [field]: value };
    setIngredients(arr);
  };
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));

  const addStep = () => setSteps([...steps, '']);
  const updateStep = (i: number, value: string) => {
    const arr = [...steps];
    arr[i] = value;
    setSteps(arr);
  };
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));

  const totalTime = (r: Recipe) => (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Recettes"
        subtitle="Gestion des recettes de l'exploitation"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus size={18} /> Nouvelle recette
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total recettes" value={String(kpis.total)} icon={<ChefHat size={20} />} color="green" />
        <KpiCard label="Publiées" value={String(kpis.published)} icon={<ChefHat size={20} />} color="blue" />
        <KpiCard label="Brouillons" value={String(kpis.draft)} icon={<ChefHat size={20} />} color="amber" />
        <KpiCard label="Ingrédients référencés" value={String(kpis.totalIngredients)} icon={<UtensilsCrossed size={20} />} color="dark" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par titre, description ou ingrédient..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20">
          <option value="all">Toutes catégories</option>
          {RECIPE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20">
          <option value="all">Tous statuts</option>
          {RECIPE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ChefHat size={48} />}
          title={recipes.length === 0 ? "Aucune recette" : "Aucun résultat"}
          message={recipes.length === 0 ? "Commencez par créer votre première recette" : "Essayez de modifier vos filtres de recherche"}
          action={recipes.length === 0 ? <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"><Plus size={16} /> Créer une recette</button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(r => (
            <RotatingCard
              key={r.id}
              className="h-[340px]"
              flipLabel="Ingrédients"
              backLabel="Retour"
              front={
                <div className="relative w-full h-full bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group" onClick={() => setDetailRecipe(r)}>
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ChefHat size={40} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={r.status} colorMap={RECIPE_STATUS_COLORS} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 truncate mb-1">{r.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{r.description || '—'}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> {totalTime(r)} min</span>
                      <span className="flex items-center gap-1"><ServingsIcon size={12} /> {r.servings} pers.</span>
                      <SimpleBadge color={DIFFICULTY_COLORS[r.difficulty] || 'gray'}>{r.difficulty}</SimpleBadge>
                    </div>
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                        <Pencil size={12} /> Modifier
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(r); }} className="px-2 py-1.5 text-xs border border-red-200 rounded-lg hover:bg-red-50 text-red-600">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              }
              back={
                <div className="w-full h-full bg-white rounded-xl border border-slate-200 overflow-hidden p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <ChefHat size={18} className="text-green-600 flex-shrink-0" />
                    <h3 className="font-semibold text-slate-900 truncate">{r.title}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1"><UtensilsCrossed size={12} /> Ingrédients</p>
                    {r.ingredients?.length > 0 ? (
                      <div className="space-y-1">
                        {r.ingredients.map((ing, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                            <span className="text-slate-700">{ing.name}</span>
                            <span className="font-medium text-slate-900">{ing.quantity} {ing.unit}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Aucun ingrédient</p>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button onClick={(e) => { e.stopPropagation(); setDetailRecipe(r); }} className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Eye size={12} /> Voir la fiche complète
                    </button>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRecipe ? 'Modifier la recette' : 'Nouvelle recette'}
        size="xl"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving || uploading} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : editRecipe ? 'Modifier' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Image de la recette</label>
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
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="form-input" placeholder="Riz au gras à la volaille" />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="form-input" rows={2} placeholder="Plat traditionnel ivoirien..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="form-input">
                {RECIPE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Difficulté</label>
              <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="form-input">
                {RECIPE_DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Temps de préparation (min)</label>
              <input type="number" value={form.prep_time_minutes} onChange={e => setForm({...form, prep_time_minutes: e.target.value})} className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Temps de cuisson (min)</label>
              <input type="number" value={form.cook_time_minutes} onChange={e => setForm({...form, cook_time_minutes: e.target.value})} className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de portions</label>
              <input type="number" value={form.servings} onChange={e => setForm({...form, servings: e.target.value})} className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="form-input">
                {RECIPE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Ingrédients</label>
              <button type="button" onClick={addIngredient} className="flex items-center gap-1 text-xs text-green-600 hover:underline"><Plus size={14} /> Ajouter</button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} placeholder="Ingrédient" className="form-input flex-1" />
                  <input type="text" value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', e.target.value)} placeholder="Qté" className="form-input w-20" />
                  <input type="text" value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} placeholder="Unité" className="form-input w-20" />
                  {ingredients.length > 1 && (
                    <button type="button" onClick={() => removeIngredient(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><X size={16} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Étapes de préparation</label>
              <button type="button" onClick={addStep} className="flex items-center gap-1 text-xs text-green-600 hover:underline"><Plus size={14} /> Ajouter</button>
            </div>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2">{i + 1}</span>
                  <textarea value={step} onChange={e => updateStep(i, e.target.value)} placeholder={`Étape ${i + 1}...`} className="form-input flex-1" rows={2} />
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(i)} className="p-2 text-red-500 hover:bg-red-50 rounded mt-1.5"><X size={16} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detailRecipe && !confirmDelete}
        onClose={() => setDetailRecipe(null)}
        title={detailRecipe?.title || ''}
        size="lg"
        footer={
          detailRecipe ? (
            <>
              <button onClick={() => setConfirmDelete(detailRecipe)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => { openEdit(detailRecipe); setDetailRecipe(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Modifier</button>
            </>
          ) : undefined
        }
      >
        {detailRecipe && (
          <div className="space-y-5">
            {detailRecipe.image_url && (
              <div className="rounded-xl overflow-hidden h-56">
                <img src={detailRecipe.image_url} alt={detailRecipe.title} className="w-full h-full object-cover" />
              </div>
            )}
            {detailRecipe.description && (
              <p className="text-sm text-slate-600">{detailRecipe.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-600"><Clock size={14} /> Prép: {detailRecipe.prep_time_minutes} min</span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-600"><Clock size={14} /> Cuisson: {detailRecipe.cook_time_minutes} min</span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-600"><ServingsIcon size={14} /> {detailRecipe.servings} portions</span>
              <SimpleBadge color={DIFFICULTY_COLORS[detailRecipe.difficulty] || 'gray'}>{detailRecipe.difficulty}</SimpleBadge>
              <SimpleBadge color="blue">{detailRecipe.category}</SimpleBadge>
              <StatusBadge status={detailRecipe.status} colorMap={RECIPE_STATUS_COLORS} />
            </div>
            {detailRecipe.ingredients?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><UtensilsCrossed size={16} /> Ingrédients</h4>
                <div className="space-y-1.5">
                  {detailRecipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm">
                      <span className="text-slate-700">{ing.name}</span>
                      <span className="font-medium text-slate-900">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detailRecipe.steps?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><ChefHat size={16} /> Préparation</h4>
                <div className="space-y-2.5">
                  {detailRecipe.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</span>
                      <p className="text-sm text-slate-600 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">Créée le {formatDate(detailRecipe.created_at)} · Modifiée le {formatDate(detailRecipe.updated_at)}</p>
          </div>
        )}
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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer la recette « {confirmDelete?.title} » ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}
