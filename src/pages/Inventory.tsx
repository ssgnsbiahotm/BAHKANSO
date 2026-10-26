import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/lib/Toast';
import { Package, AlertTriangle, AlertCircle, CheckCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { Plus, Edit, Trash, Circle } from 'lucide-react';

export function Inventory() {
  const navigate = useNavigate();
  const toast = useToast();
  const { inventoryItems, inventoryMovements, inventoryCounts } = useData();
  const [tab, setTab] = useState<'items' | 'movements' | 'counts'>('items');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    category: string;
    unit: string;
    min_stock: number;
    current_stock: number;
    location: string;
    unit_cost: number;
  }>({
    name: '',
    category: '',
    unit: '',
    min_stock: 0,
    current_stock: 0,
    location: '',
    unit_cost: 0,
  });

  // KPIs calculés depuis les données (useMemo)
  const kpis = useMemo(() => {
    const totalValue = inventoryItems.reduce((s, i) => s + i.current_stock * i.unit_cost, 0);
    const lowStock = inventoryItems.filter(i => i.current_stock < i.min_stock).length;
    // Mouvements ce mois : opérations sur les 30 derniers jours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const movementsThisMonth = inventoryMovements.filter(m => {
      const mDate = new Date(m.date);
      return mDate >= startOfMonth && mDate < new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }).length;
    return {
      totalValue,
      lowStock,
      count: inventoryItems.length,
      movementsThisMonth,
    };
  }, [inventoryItems, inventoryMovements]);

  // Ouvrir modal création
  const openCreateModal = useCallback(() => {
    setForm({
      name: '',
      category: '',
      unit: '',
      min_stock: 0,
      current_stock: 0,
      location: '',
      unit_cost: 0,
    });
    setModalOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  // Handle delete operation
  const handleDeleteOperation = useCallback(async (id: string) => {
    if (!window.confirm('Supprimer cet article ?')) return;
    // TODO: appel Supabase delete when backend ready
    toast.show('Article supprimé');
    setModalOpen(false);
  }, []);

  // Handle edit operation
  const handleEditOperation = useCallback((item: any) => {
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      min_stock: item.min_stock,
      current_stock: item.current_stock,
      location: item.location || '',
      unit_cost: item.unit_cost,
    });
    setModalOpen(true);
  }, []);

  // Refresh operations from Supabase
  const refreshOperations = useCallback(async () => {
    // TODO: rafraîchir depuis Supabase when backend ready
  }, []);

  // Handle form submit
  const handleFormSubmit = useCallback(async (values: typeof form) => {
    const payload = {
      name: values.name,
      category: values.category,
      unit: values.unit,
      min_stock: values.min_stock,
      current_stock: values.current_stock,
      location: values.location,
      unit_cost: values.unit_cost,
    };

    const run = async () => {
      try {
        // TODO: insertion Supabase when backend ready
        toast.show('Article créé avec succès');
        setModalOpen(false);
        refreshOperations();
      } catch (error) {
        toast.show('Erreur: ' + (error as Error).message, 'error');
      }
    };

    void run();
  }, [refreshOperations]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Stocks" subtitle="Gestion de l'inventaire et des mouvements" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total articles */}
        <KpiCard label="Total articles" value={String(kpis.count)} icon={<Package size={20} />} color="dark" />
        {/* Valeur totale du stock */}
        <KpiCard label="Valeur totale" value={formatCurrency(kpis.totalValue)} icon={<Package size={20} />} color="green" />
        {/* Articles en stock faible */}
        <KpiCard label="Stock faible" value={String(kpis.lowStock)} icon={<AlertTriangle size={20} />} color="amber" />
        {/* Mouvements ce mois */}
        <KpiCard label="Mouvements ce mois" value={String(kpis.movementsThisMonth)} icon={<ArrowDownCircle size={20} />} color="blue" />
      </div>

      {/* Bouton Nouvel article */}
      <div className="mb-4">
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-signal hover:bg-signal/80 text-white px-4 py-2 rounded-lg font-medium"
        >
          <Plus size={16} /> Nouvel article
        </button>
      </div>

      {tab === 'items' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryItems.map(i => (
            <RotatingCard
              key={i.id}
              flipLabel="Détails"
              backLabel="Retour"
              front={
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{i.name}</h3>
                        <p className="text-sm text-slate-500">{i.category}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${i.current_stock < i.min_stock ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                        {i.current_stock < i.min_stock ? 'Stock faible' : 'Stock suffisant'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-slate-500">Stock actuel</span> <span className={`font-bold ${i.current_stock < i.min_stock ? 'text-amber-600' : 'text-slate-900'}`}>{i.current_stock} {i.unit}</span></p>
                      <p><span className="text-slate-500">Stock minimum</span> <span className="font-medium">{i.min_stock} {i.unit}</span></p>
                      <p><span className="text-slate-500">Coût unitaire</span> <span className="font-medium">{formatCurrency(i.unit_cost)}</span></p>
                      <p><span className="text-slate-500">Emplacement</span> <span className="font-medium">{i.location || '—'}</span></p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-sm text-emerald-700 font-medium">Voir détails →</p>
                  </div>
                </div>
              }
              back={
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
                  <div className="space-y-2 text-sm">
                    <h3 className="font-semibold text-slate-900 mb-3">{i.name}</h3>
                    <p><span className="text-slate-500">Culture :</span> {i.category || '—'}</p>
                    <p><span className="text-slate-500">Superficie :</span> {i.current_stock} {i.unit}</p>
                    <p><span className="text-slate-500">Type de sol :</span> {i.location || '—'}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-200 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleEditOperation(i); }}
                      className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
                    >
                      <Edit size={14} /> Modifier
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteOperation(i.id); }}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
                    >
                      <Trash size={14} /> Supprimer
                    </button>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal open={modalOpen} onClose={closeModal} title={form.name ? 'Modifier article' : 'Nouvel article'} size="lg">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleFormSubmit(form);
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom *</label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm focus:ring-2 focus:ring-signal outline-none"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Catégorie *</label>
                <input
                  type="text"
                  name="category"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm focus:ring-2 focus:ring-signal outline-none"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Unité *</label>
                <input
                  type="text"
                  name="unit"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm focus:ring-2 focus:ring-signal outline-none"
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Stock minimum *</label>
                <input
                  type="number"
                  name="min_stock"
                  min="0"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm focus:ring-2 focus:ring-signal outline-none"
                  value={form.min_stock}
                  onChange={e => setForm({ ...form, min_stock: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Stock actuel *</label>
                <input
                  type="number"
                  name="current_stock"
                  min="0"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm focus:ring-2 focus:ring-signal outline-none"
                  value={form.current_stock}
                  onChange={e => setForm({ ...form, current_stock: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Emplacement</label>
                <input
                  type="text"
                  name="location"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm focus:ring-2 focus:ring-signal outline-none"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Coût unitaire (FCFA) *</label>
                <input
                  type="number"
                  name="unit_cost"
                  min="0"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm focus:ring-2 focus:ring-signal outline-none"
                  value={form.unit_cost}
                  onChange={e => setForm({ ...form, unit_cost: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-sm transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-signal text-white rounded-sm hover:bg-signal/80 transition-colors"
              >
                {form.name ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}