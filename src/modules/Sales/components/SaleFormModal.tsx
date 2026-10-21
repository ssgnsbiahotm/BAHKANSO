import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/lib/Toast';

interface SaleItemForm {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

// Types simplifiés pour les données de référence (sélects)
interface SiteRef {
  id: string;
  name: string;
  code: string | null;
}

interface CustomerRef {
  id: string;
  name: string;
  type: string;
  site_id: string | null;
}

interface SaleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  saleToEdit?: {
    id: string;
    site_id: string;
    customer_id: string;
    date: string;
    payment_method: string;
    items: Array<{
      id: string;
      description: string | null;
      quantity: number;
      unit: string;
      unit_price: number;
      total: number;
    }>;
  } | null;
}

const UNITS = ['kg', 'unité', 'litre', 'mètre', 'sac', 'caisse'];

export function SaleFormModal({
  isOpen,
  onClose,
  onSuccess,
  saleToEdit,
}: SaleFormModalProps) {
  const toast = useToast();
  const [sites, setSites] = useState<SiteRef[]>([]);
  const [customers, setCustomers] = useState<CustomerRef[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    site_id: '',
    customer_id: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'espèces' as 'espèces' | 'virement' | 'mobile_money',
    items: [] as SaleItemForm[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger sites et clients au montage
  useEffect(() => {
    if (isOpen) {
      loadReferenceData();
    }
  }, [isOpen]);

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (saleToEdit) {
      setFormData({
        site_id: saleToEdit.site_id || '',
        customer_id: saleToEdit.customer_id || '',
        date: saleToEdit.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        payment_method: (saleToEdit.payment_method as 'espèces' | 'virement' | 'mobile_money') || 'espèces',
        items: saleToEdit.items.map(item => ({
          id: item.id,
          description: item.description || '',
          quantity: item.quantity,
          unit: item.unit || 'kg',
          unit_price: item.unit_price,
          total: item.total,
        })),
      });
    } else {
      // Reset pour nouvelle vente
      setFormData({
        site_id: '',
        customer_id: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'espèces',
        items: [],
      });
    }
    setErrors({});
  }, [saleToEdit, isOpen]);

  const loadReferenceData = async () => {
    setLoadingData(true);
    try {
      const [sitesRes, customersRes] = await Promise.all([
        supabase.from('sites').select('id, name, code').order('name'),
        supabase.from('customers').select('id, name, type, site_id').order('name'),
      ]);

      if (sitesRes.error) throw sitesRes.error;
      if (customersRes.error) throw customersRes.error;

      setSites(sitesRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (err) {
      console.error('Erreur chargement données:', err);
      toast.show('Erreur lors du chargement des sites/clients', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.site_id) newErrors.site_id = 'Site requis';
    if (!formData.customer_id) newErrors.customer_id = 'Client requis';
    if (!formData.date) newErrors.date = 'Date requise';
    if (!formData.payment_method) newErrors.payment_method = 'Mode de paiement requis';
    if (formData.items.length === 0) newErrors.items = 'Au moins un article requis';

    const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);
    if (totalAmount <= 0) newErrors.items = 'Le total doit être supérieur à 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const calculateItemTotal = (quantity: number, unit_price: number) => {
    return Math.round(quantity * unit_price * 100) / 100;
  };

  const handleItemChange = (index: number, field: keyof SaleItemForm, value: string | number) => {
    const newItems = [...formData.items];
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    newItems[index] = { ...newItems[index], [field]: numValue };

    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? numValue : newItems[index].quantity;
      const price = field === 'unit_price' ? numValue : newItems[index].unit_price;
      newItems[index].total = calculateItemTotal(qty, price);
    }

    setFormData(prev => ({ ...prev, items: newItems }));
    if (errors.items) setErrors(prev => ({ ...prev, items: '' }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit: 'kg', unit_price: 0, total: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);

      if (saleToEdit) {
        // MODE ÉDITION
        // 1. Mettre à jour la vente
        const { error: saleError } = await supabase
          .from('sales')
          .update({
            site_id: formData.site_id,
            customer_id: formData.customer_id,
            date: formData.date,
            payment_method: formData.payment_method,
            total_amount: totalAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', saleToEdit.id);

        if (saleError) throw saleError;

        // 2. Supprimer les anciens items
        const { error: deleteError } = await supabase
          .from('sale_items')
          .delete()
          .eq('sale_id', saleToEdit.id);

        if (deleteError) throw deleteError;

        // 3. Insérer les nouveaux items
        const itemsToInsert = formData.items.map(item => ({
          sale_id: saleToEdit.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total: item.total,
          source_type: 'inventory_item',
          source_id: null,
        }));

        const { error: insertError } = await supabase
          .from('sale_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;

        toast.show('Vente modifiée avec succès', 'success');
      } else {
        // MODE CRÉATION
        const { data: newSale, error: saleError } = await supabase
          .from('sales')
          .insert({
            site_id: formData.site_id,
            customer_id: formData.customer_id,
            date: formData.date,
            payment_method: formData.payment_method,
            total_amount: totalAmount,
            status: 'payée',
            created_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .select('id')
          .single();

        if (saleError) throw saleError;
        if (!newSale) throw new Error('Échec création vente');

        // Insérer les items
        const itemsToInsert = formData.items.map(item => ({
          sale_id: newSale.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total: item.total,
          source_type: 'inventory_item',
          source_id: null,
        }));

        const { error: insertError } = await supabase
          .from('sale_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;

        toast.show('Vente créée avec succès', 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      toast.show('Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {saleToEdit ? 'Modifier la vente' : 'Nouvelle vente'}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingData && (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          )}

          {/* Ligne 1: Site + Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Site <span className="text-red-500">*</span></label>
              <select
                value={formData.site_id}
                onChange={e => setFormData(prev => ({ ...prev, site_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loadingData || saving}
              >
                <option value="">Sélectionner un site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name} {site.code ? `(${site.code})` : ''}
                  </option>
                ))}
              </select>
              {errors.site_id && <p className="mt-1 text-sm text-red-600">{errors.site_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client <span className="text-red-500">*</span></label>
              <select
                value={formData.customer_id}
                onChange={e => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loadingData || saving}
              >
                <option value="">Sélectionner un client</option>
                {customers.map(cust => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} {cust.type ? `(${cust.type})` : ''}
                  </option>
                ))}
              </select>
              {errors.customer_id && <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>}
            </div>
          </div>

          {/* Ligne 2: Date + Mode de paiement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={saving}
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mode de paiement <span className="text-red-500">*</span></label>
              <select
                value={formData.payment_method}
                onChange={e => setFormData(prev => ({ ...prev, payment_method: e.target.value as 'espèces' | 'virement' | 'mobile_money' }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={saving}
              >
                <option value="espèces">Espèces</option>
                <option value="virement">Virement</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
              {errors.payment_method && <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>}
            </div>
          </div>

          {/* Lignes d'articles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-slate-900">Articles</h3>
              <button
                type="button"
                onClick={addItem}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} /> Ajouter une ligne
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                Aucune ligne d'article. Cliquez sur "Ajouter une ligne" pour commencer.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={item.id || index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-700">Ligne {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={saving}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Supprimer cette ligne"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Description */}
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Description <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description de l'article"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          disabled={saving}
                        />
                      </div>

                      {/* Quantité */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Quantité <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          disabled={saving}
                        />
                      </div>

                      {/* Unité */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Unité</label>
                        <select
                          value={item.unit}
                          onChange={e => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          disabled={saving}
                        >
                          {UNITS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>

                      {/* Prix unitaire */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Prix unitaire <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.unit_price}
                          onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          disabled={saving}
                        />
                      </div>

                      {/* Total (calculé) */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Total</label>
                        <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.items && <p className="mt-2 text-sm text-red-600">{errors.items}</p>}
          </div>

          {/* Total général */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-900">Total de la vente</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}