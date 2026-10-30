import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, TrendingUp, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { RotatingCard } from '@/components/ui/RotatingCard';
import * as z from 'zod';
import type { InventoryItem, InventoryMovement, Site } from '@/lib/types';

import '@/styles/module-theme.css';

const itemSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  category: z.string().min(1, 'La catégorie est obligatoire'),
  unit: z.string().min(1, 'L\'unité est obligatoire'),
  min_stock: z.number().min(0, 'Le stock minimum doit être positif'),
  current_stock: z.number().min(0, 'Le stock actuel doit être positif'),
  location: z.string().optional(),
  unit_cost: z.number().min(0, 'Le coût unitaire doit être positif'),
});

type ItemFormValues = z.infer<typeof itemSchema>;

const DEFAULT_VALUES: ItemFormValues = {
  name: '',
  category: '',
  unit: '',
  min_stock: 0,
  current_stock: 0,
  location: '',
  unit_cost: 0,
};

export function Inventory() {
  const navigate = useNavigate();
  const { inventoryItems, inventoryMovements, sites, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'items' | 'movements' | 'categories'>('items');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return inventoryItems;
    const term = searchTerm.toLowerCase();
    return inventoryItems.filter(i =>
      i.name.toLowerCase().includes(term) ||
      (i.category || '').toLowerCase().includes(term) ||
      (i.location || '').toLowerCase().includes(term) ||
      i.unit.toLowerCase().includes(term)
    );
  }, [inventoryItems, searchTerm]);

  const categories = useMemo(() => {
    const cats = new Set(inventoryItems.map(i => i.category || 'Sans catégorie'));
    return Array.from(cats).sort();
  }, [inventoryItems]);

  const kpis = useMemo(() => {
    const totalValue = inventoryItems.reduce((s, i) => s + i.current_stock * i.unit_cost, 0);
    const lowStockItems = inventoryItems.filter(i => i.current_stock <= i.min_stock);
    const lowStock = lowStockItems.length;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const movementsThisMonth = inventoryMovements.filter(m => {
      const mDate = new Date(m.date);
      return mDate >= startOfMonth && mDate < new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }).length;
    return [
      { label: 'Total articles', value: String(inventoryItems.length), icon: Package, color: '#2E7D32' },
      { label: 'Valeur du stock', value: formatCurrency(totalValue), icon: Package, color: '#0277BD' },
      { label: 'Articles en alerte', value: String(lowStock), icon: AlertTriangle, color: '#C62828' },
      { label: 'Mouvements ce mois', value: String(movementsThisMonth), icon: TrendingUp, color: '#F57F17' },
    ];
  }, [inventoryItems, inventoryMovements]);

  const { values: form, setFieldValue: setForm, resetForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm({
    schema: itemSchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        category: values.category,
        unit: values.unit,
        min_stock: values.min_stock,
        current_stock: values.current_stock,
        location: values.location || null,
        unit_cost: values.unit_cost,
      };

      if (editItem) {
        const { error } = await supabase.from('inventory_items').update(payload).eq('id', editItem.id);
        if (error) throw error;
        await logAudit(
          appUser?.name || 'Système',
          'UPDATE',
          'inventory_item',
          editItem.name,
          `Article ${editItem.name} modifié`,
        );
        toast.show('Article modifié');
      } else {
        const { error } = await supabase.from('inventory_items').insert(payload);
        if (error) throw error;
        await logAudit(
          appUser?.name || 'Système',
          'CREATE',
          'inventory_item',
          payload.name,
          `Création de l'article ${payload.name}`,
        );
        toast.show('Article créé avec succès');
      }
      refresh();
    },
    onSuccess: () => { setModalOpen(false); setEditItem(null); },
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editItem,
  });

  const openCreate = useCallback(() => {
    resetForm();
    setEditItem(null);
    setModalOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((item: InventoryItem) => {
    setEditItem(item);
    setForm('name', item.name);
    setForm('category', item.category || '');
    setForm('unit', item.unit);
    setForm('min_stock', item.min_stock);
    setForm('current_stock', item.current_stock);
    setForm('location', item.location ?? '');
    setForm('unit_cost', item.unit_cost);
    setModalOpen(true);
  }, []);

  const openDetail = useCallback((item: InventoryItem) => {
    setDetailItem(item);
  }, []);

  const handleDelete = useCallback(
    (item: InventoryItem) => {
      setConfirmDelete(item);
    },
    [],
  );

  const handleDeleteConfirmed = useCallback(async (item: InventoryItem) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', item.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(
        appUser?.name || 'Système',
        'DELETE',
        'inventory_item',
        item.name,
        `Article ${item.name} supprimé`,
      );
      toast.show('Article supprimé');
      setDetailItem(null);
      refresh();
    }
  }, [appUser, refresh, toast]);

  const getItemName = (i: InventoryItem) => i.name;

  const isLowStock = (item: InventoryItem) => item.current_stock <= item.min_stock;

  const renderItemFront = (item: InventoryItem) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{item.name}</h3>
            <p className="text-sm text-slate-500">{item.category || '—'}</p>
          </div>
          <span className={`module-badge module-badge-${isLowStock(item) ? 'red' : 'green'}`}>
            {isLowStock(item) ? 'Stock faible' : 'Stock OK'}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Stock :</span> <span className={`font-medium ${isLowStock(item) ? 'text-amber-600' : 'text-slate-900'}`}>{item.current_stock} {item.unit}</span></p>
          <p><span className="text-slate-500">Mini :</span> <span className="font-medium">{item.min_stock} {item.unit}</span></p>
          <p><span className="text-slate-500">Coût :</span> <span className="font-medium">{formatCurrency(item.unit_cost)}</span></p>
          <p><span className="text-slate-500">Emplacement :</span> <span className="font-medium">{item.location || '—'}</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200">
        <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
      </div>
    </div>
  );

  const renderItemBack = (item: InventoryItem) => (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-slate-900 mb-3">{item.name}</h3>
        <p><span className="text-slate-500">Catégorie :</span> {item.category || '—'}</p>
        <p><span className="text-slate-500">Unité :</span> {item.unit}</p>
        <p><span className="text-slate-500">Stock actuel :</span> {item.current_stock}</p>
        <p><span className="text-slate-500">Stock minimum :</span> {item.min_stock}</p>
        <p><span className="text-slate-500">Coût unitaire :</span> {formatCurrency(item.unit_cost)}</p>
        <p><span className="text-slate-500">Valeur totale :</span> {formatCurrency(item.current_stock * item.unit_cost)}</p>
        <p><span className="text-slate-500">Emplacement :</span> {item.location || '—'}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/app/stocks?select=${item.id}&action=view`); }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Eye size={16} /> Voir détails
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
          >
            <Pencil size={14} /> Modifier
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(item); }}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailFields = (item: InventoryItem) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Nom</p>
          <p className="font-mono text-slate-900">{item.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Catégorie</p>
          <p className="text-slate-900">{item.category || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Unité</p>
          <p className="text-slate-900">{item.unit}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Stock actuel</p>
          <p className={`text-slate-900 font-medium ${isLowStock(item) ? 'text-amber-600' : ''}`}>{item.current_stock} {item.unit}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Stock minimum</p>
          <p className="text-slate-900">{item.min_stock} {item.unit}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Coût unitaire</p>
          <p className="text-slate-900">{formatCurrency(item.unit_cost)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Valeur totale</p>
          <p className="text-slate-900 font-medium">{formatCurrency(item.current_stock * item.unit_cost)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Emplacement</p>
          <p className="text-slate-900">{item.location || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Statut</p>
          <p className={`text-slate-900 font-medium ${isLowStock(item) ? 'text-amber-600' : 'text-green-600'}`}>
            {isLowStock(item) ? 'Stock faible' : 'Stock OK'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="module-page">
      {/* ========== HEADER ========== */}
      <header className="module-header">
        <div className="module-header-left">
          <h1>Stocks</h1>
          <p className="module-subtitle">Gestion de l'inventaire et des mouvements</p>
        </div>
        <div className="module-header-right">
          <button
            onClick={openCreate}
            className="module-btn module-btn-primary"
          >
            <Plus size={16} /> Nouvel article
          </button>
        </div>
      </header>

      {/* ========== KPI GRID ========== */}
      <div className="module-kpi-grid">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="module-kpi-card" style={{ borderLeftColor: kpi.color }}>
            <div className="module-kpi-header">
              <div className="module-kpi-icon" style={{ backgroundColor: `${kpi.color}26`, color: kpi.color }}>
                <kpi.icon size={20} />
              </div>
            </div>
            <div className="module-kpi-body">
              <p className="module-kpi-label">{kpi.label}</p>
              <div className="module-kpi-value" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========== TABS ========== */}
      <div className="module-tabs">
        <button
          className={`module-tab ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Articles ({filteredItems.length})
        </button>
        <button
          className={`module-tab ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          Mouvements ({inventoryMovements.length})
        </button>
        <button
          className={`module-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Catégories ({categories.length})
        </button>
      </div>

      {/* ========== SECTION ========== */}
      <section className="module-section" aria-labelledby="inventory-title">
        <div className="module-section-header">
          <h2 className="module-section-title" id="inventory-title">
            {activeTab === 'items' && 'Tous les articles'}
            {activeTab === 'movements' && 'Mouvements de stock'}
            {activeTab === 'categories' && 'Catégories'}
          </h2>
          {activeTab === 'items' && (
            <span className="module-section-hint">Gestion détaillée ⓘ</span>
          )}
        </div>

        {activeTab === 'items' && (
          <>
            <div className="module-search-wrapper mb-4">
              <input
                type="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, catégorie, emplacement, unité…"
                className="module-search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="module-btn module-btn-ghost ml-2"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="module-empty-state">
                <Package size={48} className="module-empty-icon" />
                <h3 className="module-empty-title">Aucun article</h3>
                <p className="module-empty-message">Créez votre premier article pour commencer.</p>
                <button
                  onClick={openCreate}
                  className="module-btn module-btn-primary"
                >
                  <Plus size={14} /> Créer un article
                </button>
              </div>
            ) : (
              <div className="module-cards-grid">
                {filteredItems.map((item) => (
                  <RotatingCard
                    key={item.id}
                    flipLabel="Détails"
                    backLabel="Retour"
                    front={renderItemFront(item)}
                    back={renderItemBack(item)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'movements' && (
          <div className="space-y-3">
            {inventoryMovements.length === 0 ? (
              <div className="module-empty-state">
                <TrendingUp size={48} className="module-empty-icon" />
                <h3 className="module-empty-title">Aucun mouvement</h3>
                <p className="module-empty-message">Les mouvements apparaîtront ici.</p>
              </div>
            ) : (
              inventoryMovements.map((movement) => (
                <div key={movement.id} className="module-movement-row">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{movement.item?.name || 'Article'}</p>
                      <p className="text-sm text-slate-500">{formatDate(movement.date)} • {movement.type === 'in' ? 'Entrée' : 'Sortie'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${movement.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.type === 'in' ? '+' : '-'}{movement.quantity} {movement.item?.unit || ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catItems = inventoryItems.filter(i => (i.category || 'Sans catégorie') === cat);
              const catValue = catItems.reduce((s, i) => s + i.current_stock * i.unit_cost, 0);
              const catLowStock = catItems.filter(i => i.current_stock <= i.min_stock).length;
              return (
                <div key={cat} className="module-category-card">
                  <h3 className="font-semibold text-slate-900">{cat}</h3>
                  <div className="space-y-1 text-sm mt-2">
                    <p><span className="text-slate-500">Articles :</span> <span className="font-medium">{catItems.length}</span></p>
                    <p><span className="text-slate-500">Valeur :</span> <span className="font-medium">{formatCurrency(catValue)}</span></p>
                    <p><span className="text-slate-500">Alertes :</span> <span className={`font-medium ${catLowStock > 0 ? 'text-amber-600' : 'text-green-600'}`}>{catLowStock}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========== MODALS ========== */}
      <DetailModal
        entity={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title="Fiche article"
        size="lg"
        renderFields={renderDetailFields}
      />

      <Modal
        open={modalOpen}
        onClose={() => { resetForm(); setModalOpen(false); setEditItem(null); }}
        title={editItem ? 'Éditer l\'article' : 'Nouvel article'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormSection title="Essentiel">
            <FormField label="Nom" required error={errors.name}>
              <FormInput
                value={form.name}
                onChange={e => setForm('name', e.target.value)}
              />
            </FormField>
            <FormField label="Catégorie" required error={errors.category}>
              <FormInput
                value={form.category}
                onChange={e => setForm('category', e.target.value)}
              />
            </FormField>
            <FormField label="Unité" required error={errors.unit}>
              <FormInput
                value={form.unit}
                onChange={e => setForm('unit', e.target.value)}
              />
            </FormField>
            <FormField label="Stock minimum" required error={errors.min_stock}>
              <FormInput
                type="number"
                step="0.01"
                min="0"
                value={form.min_stock}
                onChange={e => setForm('min_stock', Number(e.target.value) || 0)}
              />
            </FormField>
            <FormField label="Stock actuel" required error={errors.current_stock}>
              <FormInput
                type="number"
                step="0.01"
                min="0"
                value={form.current_stock}
                onChange={e => setForm('current_stock', Number(e.target.value) || 0)}
              />
            </FormField>
            <FormField label="Coût unitaire (FCFA)" required error={errors.unit_cost}>
              <FormInput
                type="number"
                step="0.01"
                min="0"
                value={form.unit_cost}
                onChange={e => setForm('unit_cost', Number(e.target.value) || 0)}
              />
            </FormField>
            <FormField label="Emplacement" error={errors.location}>
              <FormInput
                value={form.location}
                onChange={e => setForm('location', e.target.value)}
              />
            </FormField>
          </FormSection>
          <FormActions onSubmit={handleFormSubmit} onCancel={() => { resetForm(); setModalOpen(false); setEditItem(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={() => confirmDelete && handleDeleteConfirmed(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getItemName}
      />
    </div>
  );
}

// Import form primitives
import { FormField, FormInput, FormSelect, FormActions, FormSection, ConfirmDeleteModal, DetailModal } from '@/components/ui/FormPrimitives';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { Modal } from '@/components/ui/Modal';