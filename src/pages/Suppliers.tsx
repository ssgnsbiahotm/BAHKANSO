import { useMemo, useState } from 'react';
import { Truck, Star, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit, type Supplier } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

function emptyForm() {
  return { name: '', category: '', phone: '', email: '', address: '', contact_person: '', rating: '3' };
}

export function Suppliers() {
  const { suppliers, expenses, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.contact_person?.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const kpis = useMemo(() => {
    const totalPurchases = suppliers.reduce((s, sup) => s + sup.total_purchases, 0);
    const avgRating = suppliers.length > 0 ? (suppliers.reduce((s, sup) => s + sup.rating, 0) / suppliers.length).toFixed(1) : '0';
    return { totalPurchases, count: suppliers.length, avgRating };
  }, [suppliers]);

  const openCreate = () => {
    setEditSupplier(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditSupplier(s);
    setForm({
      name: s.name,
      category: s.category || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      contact_person: s.contact_person || '',
      rating: String(s.rating),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.show('Le nom du fournisseur est obligatoire', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      contact_person: form.contact_person || null,
      rating: parseInt(form.rating) || 3,
    };
    if (editSupplier) {
      const { error } = await supabase.from('suppliers').update(payload).eq('id', editSupplier.id);
      if (error) { toast.show('Erreur: ' + error.message, 'error'); }
      else {
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'supplier', editSupplier.id, `Fournisseur "${form.name}" modifié`);
        toast.show('Fournisseur modifié');
        setModalOpen(false);
        refresh();
      }
    } else {
      const { error } = await supabase.from('suppliers').insert({ ...payload, total_purchases: 0 });
      if (error) { toast.show('Erreur: ' + error.message, 'error'); }
      else {
        await logAudit(appUser?.name || 'Système', 'CREATE', 'supplier', null, `Fournisseur "${form.name}" créé`);
        toast.show('Fournisseur créé');
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('suppliers').delete().eq('id', confirmDelete.id);
    if (error) { toast.show('Erreur: ' + error.message, 'error'); }
    else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'supplier', confirmDelete.id, `Fournisseur "${confirmDelete.name}" supprimé`);
      toast.show('Fournisseur supprimé');
      setConfirmDelete(null);
      refresh();
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Fournisseurs"
        subtitle="Gestion des fournisseurs et historique d'achats"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus size={18} /> Nouveau fournisseur
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total fournisseurs" value={String(kpis.count)} icon={<Truck size={20} />} color="dark" />
        <KpiCard label="Total achats" value={formatCurrency(kpis.totalPurchases)} icon={<Truck size={20} />} color="green" />
        <KpiCard label="Note moyenne" value={`${kpis.avgRating} / 5`} icon={<Star size={20} />} color="amber" />
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un fournisseur..."
          className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Truck size={48} />}
          title={suppliers.length === 0 ? "Aucun fournisseur" : "Aucun résultat"}
          message={suppliers.length === 0 ? "Ajoutez votre premier fournisseur" : "Essayez de modifier votre recherche"}
          action={suppliers.length === 0 ? <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"><Plus size={16} /> Ajouter</button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => {
            const supplierExpenses = expenses.filter(e => e.supplier_id === s.id);
            const totalSpent = supplierExpenses.reduce((sum, e) => sum + e.amount, 0);
            return (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><Truck size={20} /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{s.name}</h3>
                      <p className="text-xs text-slate-500">{s.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < s.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Contact</span><span className="font-medium">{s.contact_person || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Téléphone</span><span className="font-medium">{s.phone || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-xs">{s.email || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Adresse</span><span className="font-medium text-xs">{s.address || '—'}</span></div>
                  <div className="flex justify-between border-t border-slate-100 pt-2"><span className="text-slate-500">Total achats</span><span className="font-bold text-green-600">{formatCurrency(totalSpent)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Nb transactions</span><span className="font-medium">{supplierExpenses.length}</span></div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                    <Pencil size={12} /> Modifier
                  </button>
                  <button onClick={() => setConfirmDelete(s)} className="px-2.5 py-1.5 text-xs border border-red-200 rounded-lg hover:bg-red-50 text-red-600" title="Supprimer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Enregistrement...' : editSupplier ? 'Modifier' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="form-input" placeholder="AgriSupplies SARL" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
            <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="form-input" placeholder="Matériel agricole" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contact</label>
            <input type="text" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} className="form-input" placeholder="Kouadio Mensah" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
            <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="form-input" placeholder="+225 07 00 00 00 00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="form-input" placeholder="contact@agrisupplies.ci" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Adresse</label>
            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="form-input" placeholder="Bouaké, Côte d'Ivoire" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Note (0-5)</label>
            <select value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} className="form-input">
              {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </Modal>

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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer le fournisseur « {confirmDelete?.name} » ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}
