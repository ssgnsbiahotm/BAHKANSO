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
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { FormField, FormInput, FormSelect, FormTextarea, FormActions, ConfirmDeleteModal, DetailModal } from '@/components/ui/FormPrimitives';
import * as z from 'zod';

const supplierSchema = z.object({
  name: z.string().min(1, 'Le nom du fournisseur est obligatoire'),
  category: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).default(3),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

const DEFAULT_VALUES: SupplierFormValues = {
  name: '',
  category: '',
  phone: '',
  email: '',
  address: '',
  contact_person: '',
  rating: 3,
};

export function Suppliers() {
  const { suppliers, expenses, refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Supplier | null>(null);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
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

  const { values: form, setFieldValue: setForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm({
    schema: supplierSchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      const payload = {
        name: values.name.trim(),
        category: values.category || null,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        contact_person: values.contact_person || null,
        rating: values.rating,
      };

      if (editSupplier) {
        const { error } = await supabase.from('suppliers').update(payload).eq('id', editSupplier.id);
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'UPDATE', 'supplier', editSupplier.id, `Fournisseur "${values.name}" modifié`);
        toast.show('Fournisseur modifié');
      } else {
        const { error } = await supabase.from('suppliers').insert({ ...payload, total_purchases: 0 });
        if (error) throw error;
        await logAudit(appUser?.name || 'Système', 'CREATE', 'supplier', null, `Fournisseur "${values.name}" créé`);
        toast.show('Fournisseur créé');
      }
      refresh();
    },
    onSuccess: () => setModalOpen(false),
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editSupplier,
  });

  const openCreate = () => {
    setEditSupplier(null);
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditSupplier(s);
    setForm('name', s.name);
    setForm('category', s.category || '');
    setForm('phone', s.phone || '');
    setForm('email', s.email || '');
    setForm('address', s.address || '');
    setForm('contact_person', s.contact_person || '');
    setForm('rating', s.rating);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('suppliers').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'supplier', confirmDelete.id, `Fournisseur "${confirmDelete.name}" supprimé`);
      toast.show('Fournisseur supprimé');
      setConfirmDelete(null);
      setDetailSupplier(null);
      refresh();
    }
  };

  const getSupplierName = (s: Supplier) => s.name;

  const renderDetailFields = (s: Supplier) => {
    const supplierExpenses = expenses.filter(e => e.supplier_id === s.id);
    const totalSpent = supplierExpenses.reduce((sum, e) => sum + e.amount, 0);
    return (
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-xs text-slate-400">Nom</p><p className="text-sm font-medium">{s.name}</p></div>
        <div><p className="text-xs text-slate-400">Catégorie</p><p className="text-sm font-medium">{s.category || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Contact</p><p className="text-sm font-medium">{s.contact_person || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Téléphone</p><p className="text-sm font-medium">{s.phone || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Email</p><p className="text-sm font-medium">{s.email || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Adresse</p><p className="text-sm font-medium">{s.address || '—'}</p></div>
        <div><p className="text-xs text-slate-400">Note</p><p className="text-sm font-medium">{s.rating} / 5</p></div>
        <div><p className="text-xs text-slate-400">Total achats</p><p className="text-sm font-medium text-green-600">{formatCurrency(totalSpent)}</p></div>
        <div><p className="text-xs text-slate-400">Nb transactions</p><p className="text-sm font-medium">{supplierExpenses.length}</p></div>
      </div>
    );
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
        onClose={() => { setModalOpen(false); setEditSupplier(null); }}
        title={editSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <FormField label="Nom" required error={errors.name}>
            <FormInput value={form.name} onChange={e => setForm('name', e.target.value)} placeholder="AgriSupplies SARL" />
          </FormField>
          <FormField label="Catégorie" error={errors.category}>
            <FormInput value={form.category} onChange={e => setForm('category', e.target.value)} placeholder="Matériel agricole" />
          </FormField>
          <FormField label="Contact" error={errors.contact_person}>
            <FormInput value={form.contact_person} onChange={e => setForm('contact_person', e.target.value)} placeholder="Kouadio Mensah" />
          </FormField>
          <FormField label="Téléphone" error={errors.phone}>
            <FormInput value={form.phone} onChange={e => setForm('phone', e.target.value)} placeholder="+225 07 00 00 00 00" />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <FormInput type="email" value={form.email} onChange={e => setForm('email', e.target.value)} placeholder="contact@agrisupplies.ci" />
          </FormField>
          <FormField label="Adresse" error={errors.address}>
            <FormTextarea value={form.address} onChange={e => setForm('address', e.target.value)} placeholder="Bouaké, Côte d'Ivoire" rows={2} />
          </FormField>
          <FormField label="Note (0-5)" error={errors.rating}>
            <FormSelect value={form.rating} onChange={e => setForm('rating', parseInt(e.target.value) || 3)}>
              {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </FormSelect>
          </FormField>
          <FormActions onSubmit={handleFormSubmit} onCancel={() => { setModalOpen(false); setEditSupplier(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      <DetailModal
        entity={detailSupplier}
        onClose={() => setDetailSupplier(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title="Détails fournisseur"
        size="md"
        renderFields={renderDetailFields}
      />

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getSupplierName}
      />
    </div>
  );
}