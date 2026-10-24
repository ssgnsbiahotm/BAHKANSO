import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/Toast';

interface Line {
  description: string;
  quantity: number;
  unit_price: number;
  source_type: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  saleToEdit: any | null;
  onSuccess: () => void;
}

export function SaleFormModal({ isOpen, onClose, saleToEdit, onSuccess }: Props) {
  const { appUser } = useAuth();
  const { show: toast } = useToast();

  // States
  const [customers, setCustomers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [lines, setLines] = useState<Line[]>([
    { description: '', quantity: 1, unit_price: 0, source_type: 'harvest' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chargement clients + sites à l'ouverture
  useEffect(() => {
    if (!isOpen) return;
    supabase.from('customers').select('id, name').order('name').then(({data}) => setCustomers(data || []));
    supabase.from('sites').select('id, name').order('name').then(({data}) => setSites(data || []));
    if (appUser?.site_id) setSiteId(appUser.site_id);
  }, [isOpen, appUser]);

  // Pré-remplissage si édition
  useEffect(() => {
    if (saleToEdit) {
      setCustomerId(saleToEdit.customer_id || '');
      setSiteId(saleToEdit.site_id || '');
      setDate(saleToEdit.date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(saleToEdit.payment_method || 'Espèces');
    }
  }, [saleToEdit]);

  // Total calculé
  const total = lines.reduce((sum, l) => sum + (Number(l.quantity) * Number(l.unit_price)), 0);

  // Ajouter une ligne
  const addLine = () => {
    setLines([...lines, { description: '', quantity: 1, unit_price: 0, source_type: 'harvest' }]);
  };

  // Supprimer une ligne
  const removeLine = (index: number) => {
    if (lines.length === 1) return; // Garder au moins 1 ligne
    setLines(lines.filter((_, i) => i !== index));
  };

  // Modifier une ligne
  const updateLine = (index: number, field: keyof Line, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !siteId || total <= 0) {
      toast('Remplissez le client, le site et au moins une ligne avec quantité et prix.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: saleData, error: saleError } = await supabase.from('sales').insert({
        customer_id: customerId,
        site_id: siteId,
        date,
        payment_method: paymentMethod,
        total_amount: total,
        status: 'payée',
        created_by: appUser?.id
      }).select().single();
      if (saleError) throw saleError;

      const items = lines.filter(l => l.description && l.quantity > 0).map(l => ({
        sale_id: saleData.id,
        description: l.description,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price),
        source_type: l.source_type,
        source_id: siteId || ''
      }));
      const { error: itemsError } = await supabase.from('sale_items').insert(items);
      if (itemsError) throw itemsError;

      toast('Vente enregistrée', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast('Erreur: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="shrink-0 p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{saleToEdit ? 'Modifier la vente' : 'Nouvelle vente'}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site *</label>
              <select value={siteId} onChange={e => setSiteId(e.target.value)} className="w-full border rounded-lg px-3 py-2" required>
                <option value="">Sélectionner</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client *</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full border rounded-lg px-3 py-2" required>
                <option value="">Sélectionner</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mode de paiement *</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                <option>Espèces</option>
                <option>Virement</option>
                <option>Mobile Money</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Articles</h3>
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <label className="block text-xs text-slate-600 mb-1">Description</label>
                    <input type="text" value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} placeholder="ex: 500 kg de maïs" className="w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-600 mb-1">Qté</label>
                    <input type="number" value={line.quantity} onChange={e => updateLine(idx, 'quantity', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-600 mb-1">Prix unit.</label>
                    <input type="number" value={line.unit_price} onChange={e => updateLine(idx, 'unit_price', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-slate-600 mb-1">Type</label>
                    <select value={line.source_type} onChange={e => updateLine(idx, 'source_type', e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
                      <option value="harvest">Récolte</option>
                      <option value="animal">Animal</option>
                      <option value="animal_lot">Lot</option>
                      <option value="inventory_item">Stock</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <button type="button" onClick={() => removeLine(idx)} className="text-red-600 hover:bg-red-50 p-1 rounded" disabled={lines.length === 1}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLine} className="mt-3 w-full border-2 border-dashed border-green-500 text-green-700 rounded-lg py-2 font-semibold hover:bg-green-50 flex items-center justify-center gap-2">
              <Plus size={18} /> Ajouter une ligne
            </button>
          </div>

          <div className="bg-green-50 p-4 rounded-lg flex justify-between items-center">
            <span className="font-semibold">Total de la vente</span>
            <span className="text-2xl font-bold text-green-700">{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        {/* Footer fixe */}
        <div className="shrink-0 p-6 border-t bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">Annuler</button>
          <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {isSubmitting ? 'Enregistrement...' : (saleToEdit ? 'Mettre à jour' : 'Enregistrer')}
          </button>
        </div>
      </form>
    </div>
  );
}