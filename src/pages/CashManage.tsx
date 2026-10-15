import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Trash2, Pencil, Eye, Loader2, Save, CheckCircle, XCircle, Receipt, Banknote, CreditCard } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import { useToast } from '@/lib/Toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { SimpleBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import * as z from 'zod';

// Schéma de validation pour les mouvements de trésorerie
const cashTransactionSchema = z.object({
  date: z.date(),
  description: z.string().min(1, 'La description est obligatoire'),
  amount: z.number().refine(val => val !== 0, 'Le montant doit être différent de zéro'),
  type: z.enum(['income', 'expense']),
  category: z.enum([
    'vente_produit',
    'subvention',
    'autre_revenu',
    'aliment_animal',
    'soins_veterinaires',
    'carburant',
    'main_doeuvre',
    'maintenance',
    'assurance',
    'impots',
    'autre_depense'
  ]),
  payment_method: z.enum([
    'especes',
    'cheque',
    'virement',
    'carte_bancaire',
    'prelevement',
    'autre'
  ]),
  reference: z.string().optional(),
  related_entity_type: z.enum(['animal', 'plot', 'campaign', 'none']).default('none'),
  related_entity_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

interface CashTransactionFormValues {
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category:
    | 'vente_produit'
    | 'subvention'
    | 'autre_revenu'
    | 'aliment_animal'
    | 'soins_veterinaires'
    | 'carburant'
    | 'main_doeuvre'
    | 'maintenance'
    | 'assurance'
    | 'impots'
    | 'autre_depense';
  payment_method:
    | 'especes'
    | 'cheque'
    | 'virement'
    | 'carte_bancaire'
    | 'prelevement'
    | 'autre';
  reference?: string;
  related_entity_type: 'animal' | 'plot' | 'campaign' | 'none';
  related_entity_id?: string;
  notes?: string;
}

export function CashManage() {
  const { cashTransactions, animals, plots, campaigns, refresh } = useData() as any;
  const { appUser } = useAuth();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<any>(null);
  const [detailTransaction, setDetailTransaction] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formErrors, setFormErrors] = useState({});
  const { values: form, setFieldValue: setForm, errors: validationErrors } = useValidatedForm({
    schema: cashTransactionSchema,
    defaultValues: {
      date: new Date(),
      description: '',
      amount: 0,
      type: 'income',
      category: 'vente_produit',
      payment_method: 'especes',
      reference: '',
      related_entity_type: 'none',
      related_entity_id: undefined,
      notes: '',
    },
    onSubmit: async () => {
      // Fonction factice pour satisfaire TypeScript
      // La vraie logique de soumission est dans handleSubmit ci-dessous
    }
  });

  const filteredTransactions = useMemo(() => {
    if (!cashTransactions) return [];

    let filtered = [...cashTransactions];

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(term) ||
        t.reference?.toLowerCase().includes(term) ||
        (t.notes || '').toLowerCase().includes(term) ||
        t.category.toString().includes(term) ||
        t.payment_method.toString().includes(term)
      );
    }

    // Filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filtre par catégorie
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    return filtered;
  }, [cashTransactions, searchTerm, filterType, filterCategory]);

  const kpis = useMemo(() => {
    if (!cashTransactions) return { totalIncome: 0, totalExpense: 0, netBalance: 0, transactionCount: 0 };

    const totalIncome = cashTransactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: any, t: any) => sum + t.amount, 0);

    const totalExpense = cashTransactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: any, t: any) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount: cashTransactions.length
    };
  }, [cashTransactions]);

  const openCreate = () => {
    setEditTransaction(null);
    setForm('date', new Date());
    setForm('description', '');
    setForm('amount', 0);
    setForm('type', 'income');
    setForm('category', 'vente_produit');
    setForm('payment_method', 'especes');
    setForm('reference', '');
    setForm('related_entity_type', 'none');
    setForm('related_entity_id', undefined);
    setForm('notes', '');
    setModalOpen(true);
  };

  const openEdit = (transaction: any) => {
    setEditTransaction(transaction);
    setForm('date', transaction.date ? new Date(transaction.date) : new Date());
    setForm('description', transaction.description);
    setForm('amount', transaction.amount);
    setForm('type', transaction.type);
    setForm('category', transaction.category);
    setForm('payment_method', transaction.payment_method);
    setForm('reference', transaction.reference || '');
    setForm('related_entity_type', transaction.related_entity_type || 'none');
    setForm('related_entity_id', transaction.related_entity_id || undefined);
    setForm('notes', transaction.notes || '');
    setDetailTransaction(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    // Validation avec Zod
    const validationResult = cashTransactionSchema.safeParse(form);
    if (!validationResult.success) {
      // Créer un objet d'erreurs à partir du résultat de validation
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach(issue => {
        if (issue.path[0]) {
          const key = String(issue.path[0]);
          newErrors[key] = issue.message;
        }
      });
      setFormErrors(newErrors);

      // Afficher la première erreur pour simplicité
      const firstError = validationResult.error.issues[0];
      toast.show(`${String(firstError.path[0])}: ${firstError.message}`, 'error');
      return;
    }

    // Effacer les erreurs si la validation réussit
    setFormErrors({});

    setSaving(true);
    try {
      const payload = {
        date: form.date ? form.date.toISOString().split('T')[0] : null,
        description: form.description,
        amount: form.amount,
        type: form.type,
        category: form.category,
        payment_method: form.payment_method,
        reference: form.reference || null,
        related_entity_type: form.related_entity_type,
        related_entity_id: form.related_entity_id || null,
        notes: form.notes || null,
      };

      if (editTransaction) {
        const { error } = await supabase.from('cash_transactions').update(payload).eq('id', editTransaction.id);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'UPDATE', 'cash_transaction', editTransaction.reference || editTransaction.id.toString(), `Mouvement de trésorerie ${editTransaction.reference || editTransaction.id} modifié`);
          toast.show('Mouvement modifié');
          setModalOpen(false);
          refresh();
        }
      } else {
        const { error } = await supabase.from('cash_transactions').insert(payload);
        if (error) {
          toast.show('Erreur: ' + error.message, 'error');
        } else {
          await logAudit(appUser?.name || 'Système', 'CREATE', 'cash_transaction', payload.reference || 'sans référence', `Création du mouvement de trésorerie ${payload.description}`);
          toast.show('Mouvement créé avec succès');
          setModalOpen(false);
          refresh();
        }
      }
    } catch (error) {
      toast.show('Erreur inattendue: ' + (error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('cash_transactions').delete().eq('id', confirmDelete.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(appUser?.name || 'Système', 'DELETE', 'cash_transaction', confirmDelete.reference || confirmDelete.id.toString(), `Mouvement de trésorerie ${confirmDelete.reference || confirmDelete.id} supprimé`);
      toast.show('Mouvement supprimé');
      setConfirmDelete(null);
      setDetailTransaction(null);
      refresh();
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestion de la trésorerie"
        subtitle="Suivi des mouvements financiers de l'exploitation"
        actions={
          <>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              <Plus size={18} /> Nouveau mouvement
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Revenus totaux" value={formatCurrency(kpis.totalIncome)} icon={<DollarSign size={20} />} color="green" />
        <KpiCard label="Dépenses totales" value={formatCurrency(kpis.totalExpense)} icon={<DollarSign size={20} />} color="red" />
        <KpiCard label="Solde net" value={formatCurrency(kpis.netBalance)} icon={<TrendingUp size={20} />} color={kpis.netBalance >= 0 ? 'green' : 'red'} />
        <KpiCard label="Nombre de mouvements" value={String(kpis.transactionCount)} icon={<Receipt size={20} />} color="blue" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Rechercher</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
            placeholder="Rechercher par description, référence, catégorie..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="all">Tous les types</option>
            <option value="income">Revenus</option>
            <option value="expense">Dépenses</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="all">Toutes les catégories</option>
            <option value="vente_produit">Vente de produits</option>
            <option value="subvention">Subventions</option>
            <option value="autre_revenu">Autre revenu</option>
            <option value="aliment_animal">Aliment animal</option>
            <option value="soins_veterinaires">Soins vétérinaires</option>
            <option value="carburant">Carburant</option>
            <option value="main_doeuvre">Main d'œuvre</option>
            <option value="maintenance">Maintenance</option>
            <option value="assurance">Assurance</option>
            <option value="impots">Impôts</option>
            <option value="autre_depense">Autre dépense</option>
          </select>
        </div>
        <div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterCategory('all');
            }}
            className="w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {(!cashTransactions || cashTransactions.length === 0) ? (
        <EmptyState
          icon={<DollarSign size={48} />}
          title="Aucun mouvement de trésorerie"
          message="Aucun mouvement financier enregistré"
          action={<button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"><Plus size={16} /> Nouveau mouvement</button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Méthode</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Référence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map((transaction: any) => (
                <tr key={transaction.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(transaction.date)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{transaction.description}</td>
                  <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(transaction.amount)}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <SimpleBadge color={transaction.type === 'income' ? 'green' : 'red'}>
                      {transaction.type === 'income' ? 'Revenu' : 'Dépense'}
                    </SimpleBadge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{transaction.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{transaction.payment_method.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">{transaction.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!detailTransaction && !confirmDelete}
        onClose={() => setDetailTransaction(null)}
        title={`Mouvement du ${detailTransaction?.date ? formatDate(String(detailTransaction.date)) : ''}`}
        size="lg"
        footer={
          detailTransaction ? (
            <>
              <button onClick={() => setConfirmDelete(detailTransaction)} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Supprimer</button>
              <button onClick={() => openEdit(detailTransaction)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
            </>
          ) : undefined
        }
      >
        {detailTransaction && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{detailTransaction.description}</h2>
                <p className="text-sm text-slate-500">{formatDate(String(detailTransaction.date))}</p>
              </div>
              <SimpleBadge color={
                detailTransaction.type === 'income' ? 'green' : 'red'
              }>
                {detailTransaction.type === 'income' ? 'Revenu' : 'Dépense'}
              </SimpleBadge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400">Description</p><p className="text-sm font-medium">{detailTransaction.description}</p></div>
              <div><p className="text-xs text-slate-400">Montant</p><p className="text-sm font-medium">{formatCurrency(detailTransaction.amount)}</p></div>
              <div><p className="text-xs text-slate-400">Type</p><p className="text-sm font-medium">{detailTransaction.type === 'income' ? 'Revenu' : 'Dépense'}</p></div>
              <div><p className="text-xs text-slate-400">Catégorie</p><p className="text-sm font-medium">{detailTransaction.category.replace(/_/g, ' ')}</p></div>
              <div><p className="text-xs text-slate-400">Méthode de paiement</p><p className="text-sm font-medium">{detailTransaction.payment_method.replace(/_/g, ' ')}</p></div>
              <div><p className="text-xs text-slate-400">Date</p><p className="text-sm font-medium">{formatDate(String(detailTransaction.date))}</p></div>
              <div><p className="text-xs text-slate-400">Référence</p><p className="text-sm font-medium">{detailTransaction.reference || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Entité liée</p><p className="text-sm font-medium">
                {detailTransaction.related_entity_type === 'none' ? 'Aucune' :
                  detailTransaction.related_entity_type === 'animal' ? `Animal #${detailTransaction.related_entity_id}` :
                  detailTransaction.related_entity_type === 'plot' ? `Parcelle #${detailTransaction.related_entity_id}` :
                  `Campagne #${detailTransaction.related_entity_id}`}
              </p></div>
              <div><p className="text-xs text-slate-400">Notes</p><p className="text-sm font-medium">{detailTransaction.notes || '—'}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTransaction ? 'Modifier le mouvement' : 'Nouveau mouvement'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editTransaction ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={form.date ? form.date.toISOString().split('T')[0] : ''}
              onChange={(e) => setForm('date', e.target.value ? new Date(e.target.value) : new Date())}
              className={`form-input ${validationErrors.date ? 'border-red-500' : ''}`}
            />
            {validationErrors.date && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.date}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm('description', e.target.value)}
              className={`form-input ${validationErrors.description ? 'border-red-500' : ''}`}
              placeholder="Vente de lait, achat d'aliment, etc."
            />
            {validationErrors.description && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.description}</p>
            )}
            {validationErrors.description && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.description}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Montant *</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm('amount', parseFloat(e.target.value) || 0)}
              className={`form-input ${validationErrors.amount ? 'border-red-500' : ''}`}
              min="0.01"
              step="0.01"
            />
            {validationErrors.amount && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.amount}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm('type', e.target.value as any)}
              className="form-input"
            >
              <option value="income">Revenu</option>
              <option value="expense">Dépense</option>
            </select>
            {validationErrors.type && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.type}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie *</label>
            <select
              value={form.category}
              onChange={(e) => setForm('category', e.target.value as any)}
              className="form-input"
            >
              <option value="vente_produit">Vente de produit</option>
              <option value="subvention">Subvention</option>
              <option value="autre_revenu">Autre revenu</option>
              <option value="aliment_animal">Aliment animal</option>
              <option value="soins_veterinaires">Soins vétérinaires</option>
              <option value="carburant">Carburant</option>
              <option value="main_doeuvre">Main d'œuvre</option>
              <option value="maintenance">Maintenance</option
              ><option value="assurance">Assurance</option>
              <option value="impots">Impôts</option>
              <option value="autre_depense">Autre dépense</option>
            </select>
            {validationErrors.category && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.category}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Méthode de paiement *</label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm('payment_method', e.target.value as any)}
              className="form-input"
            >
              <option value="especes">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement</option>
              <option value="carte_bancaire">Carte bancaire</option>
              <option value="prelevement">Prélèvement</option>
              <option value="autre">Autre</option>
            </select>
            {validationErrors.payment_method && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.payment_method}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Référence (optionnel)</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm('reference', e.target.value)}
              className="form-input"
              placeholder="FACT-001, CHQ-123, etc."
            />
            {validationErrors.reference && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.reference}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Entité liée</label>
            <select
              value={form.related_entity_type}
              onChange={(e) => setForm('related_entity_type', e.target.value as any)}
              className="form-input"
            >
              <option value="none">Aucune</option>
              <option value="animal">Animal</option>
              <option value="plot">Parcelle</option>
              <option value="campaign">Campagne</option>
            </select>
            {validationErrors.related_entity_type && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.related_entity_type}</p>
            )}
          </div>
          {form.related_entity_type !== 'none' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ID de l'entité liée</label>
                <input
                  type="text"
                  value={form.related_entity_id || ''}
                  onChange={(e) => setForm('related_entity_id', e.target.value)}
                  className="form-input"
                  placeholder="UUID de l'entité liée"
                />
                {validationErrors.related_entity_id && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.related_entity_id}</p>
                )}
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm('notes', e.target.value)}
              className="form-input"
              rows={3}
              placeholder="Informations complémentaires..."
            />
            {validationErrors.notes && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.notes}</p>
            )}
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
        <p className="text-sm text-slate-600">Voulez-vous vraiment supprimer le mouvement « {confirmDelete?.description} » du {confirmDelete?.date ? formatDate(String(confirmDelete.date)) : ''} ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}

// Extrait les erreurs du hook useValidatedForm pour une utilisation plus simple dans ce composant
function extractErrors<T>(result: any): Partial<Record<keyof T, string>> {
  // Cette fonction serait normalement fournie par le hook useValidatedForm
  // Pour cet exemple, on retourne un objet vide
  return {};
}