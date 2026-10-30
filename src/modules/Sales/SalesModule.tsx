import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, CreditCard, TrendingUp, Plus, Eye, Pencil, Trash2, Filter, ChevronDown, MapPin, Calendar, DollarSign, Package } from 'lucide-react';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { formatCurrency, formatDate } from '@/lib/format';
import { useSalesData } from './hooks/useSalesData';
import { useToast } from '@/lib/Toast';
import type { SaleWithRelations } from './hooks/useSalesData';
import { SaleFormModal } from './components/SaleFormModal';
import { SaleDetailsModal } from './components/SaleDetailsModal';
import { useSite } from '@/lib/SiteContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/types';
import * as z from 'zod';
import { useValidatedForm } from '@/components/ui/ValidatedForm';
import { FormField, FormInput, FormSelect, FormActions, FormSection, ConfirmDeleteModal, DetailModal } from '@/components/ui/FormPrimitives';
import { Accordion } from '@/components/ui/Accordion';
import { Modal } from '@/components/ui/Modal';

import '@/styles/module-theme.css';

const saleSchema = z.object({
  site_id: z.string().min(1, 'Le site est obligatoire'),
  customer_id: z.string().min(1, 'Le client est obligatoire'),
  date: z.string().min(1, 'La date est obligatoire'),
  payment_method: z.enum(['espèces', 'virement', 'chèque', 'mobile money', 'carte']).default('espèces'),
  items: z.array(z.object({
    description: z.string().min(1, 'La description est obligatoire'),
    quantity: z.number().positive('La quantité doit être positive'),
    unit: z.string().min(1, 'L\'unité est obligatoire'),
    unit_price: z.number().min(0, 'Le prix unitaire ne peut pas être négatif'),
    total: z.number().min(0),
  })).min(1, 'Au moins un article est obligatoire'),
});

type SaleFormValues = z.infer<typeof saleSchema>;
type PaymentMethod = SaleFormValues['payment_method'];
type SaleItem = SaleFormValues['items'][0];

const DEFAULT_VALUES: SaleFormValues = {
  site_id: '',
  customer_id: '',
  date: new Date().toISOString().split('T')[0],
  payment_method: 'espèces',
  items: [{ description: '', quantity: 1, unit: 'kg', unit_price: 0, total: 0 }],
};

function statusLabel(status: string) {
  return status === 'payée' ? 'Payée' : status === 'en_attente' ? 'En attente' : status === 'annulée' ? 'Annulée' : status;
}

const paymentMethodLabels: Record<string, string> = {
  'espèces': 'Espèces',
  'virement': 'Virement',
  'chèque': 'Chèque',
  'mobile money': 'Mobile Money',
  'carte': 'Carte',
};

const periodLabels: Record<string, string> = {
  month: 'Ce mois',
  quarter: 'Ce trimestre',
  year: 'Cette année',
  all: 'Tout',
};

const statusOptions = ['', 'payée', 'en_attente', 'annulée'];

export function SalesModule() {
  const navigate = useNavigate();
  const { sales, customers, stats, loading, error, refresh, deleteSale } = useSalesData();
  const { currentSiteId, availableSites, isGlobalView } = useSite();
  const { appUser } = useAuth();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editSale, setEditSale] = useState<SaleWithRelations | null>(null);
  const [detailSale, setDetailSale] = useState<SaleWithRelations | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SaleWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState<'ventes' | 'clients' | 'par_mois'>('ventes');
  const [searchTerm, setSearchTerm] = useState('');

  // Use currentSiteId from useSite for filtering
  const effectiveSiteId = useMemo(() => currentSiteId, [currentSiteId]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Site filtering via useSite context
      if (effectiveSiteId && sale.site_id !== effectiveSiteId) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchRef = (sale.reference || '').toLowerCase().includes(term);
        const matchClient = (sale.customer?.name || '').toLowerCase().includes(term);
        const matchSite = (sale.site?.name || '').toLowerCase().includes(term);
        const matchItems = sale.items?.some(item =>
          (item.description || '').toLowerCase().includes(term)
        ) ?? false;
        if (!matchRef && !matchClient && !matchSite && !matchItems) return false;
      }
      return true;
    });
  }, [sales, effectiveSiteId, searchTerm]);

  const kpis = useMemo(() => {
    const baseSales = effectiveSiteId
      ? sales.filter(s => s.site_id === effectiveSiteId)
      : sales;
    const totalRevenue = baseSales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
    const salesCount = baseSales.length;
    const avgSale = salesCount > 0 ? totalRevenue / salesCount : 0;
    const activeClients = customers.filter(c =>
      baseSales.some(s => s.customer_id === c.id)
    ).length;
    return [
      { label: 'Chiffre d\'affaires', value: formatCurrency(totalRevenue), iconColor: '#2E7D32' },
      { label: 'Nombre de ventes', value: String(salesCount), iconColor: '#0277BD' },
      { label: 'Panier moyen', value: formatCurrency(avgSale), iconColor: '#F57F17' },
      { label: 'Clients actifs', value: String(activeClients), iconColor: '#C62828' },
    ];
  }, [sales, customers, effectiveSiteId]);

  const { values: form, setFieldValue: setForm, resetForm, errors, isSubmitting, handleSubmit: handleFormSubmit } = useValidatedForm<SaleFormValues>({
    schema: saleSchema,
    defaultValues: DEFAULT_VALUES,
    onSubmit: async (values) => {
      // Calculate totals for items
      const itemsWithTotals = values.items.map(item => ({
        ...item,
        total: item.quantity * item.unit_price,
      }));
      const totalAmount = itemsWithTotals.reduce((s, item) => s + item.total, 0);

      const payload = {
        site_id: values.site_id,
        customer_id: values.customer_id,
        date: values.date,
        payment_method: values.payment_method,
        total_amount: totalAmount,
        items: itemsWithTotals,
      };

      if (editSale) {
        const { error } = await supabase.from('sales').update({
          site_id: payload.site_id,
          customer_id: payload.customer_id,
          date: payload.date,
          payment_method: payload.payment_method,
          total_amount: payload.total_amount,
        }).eq('id', editSale.id);
        if (error) throw error;

        // Delete old items and insert new ones
        await supabase.from('sale_items').delete().eq('sale_id', editSale.id);
        if (itemsWithTotals.length > 0) {
          const { error: itemsError } = await supabase.from('sale_items').insert(
            itemsWithTotals.map(item => ({ ...item, sale_id: editSale.id }))
          );
          if (itemsError) throw itemsError;
        }

        await logAudit(
          appUser?.name || 'Système',
          'UPDATE',
          'sale',
          editSale.reference || '',
          `Vente ${editSale.reference} modifiée`,
        );
        toast.show('Vente modifiée');
      } else {
        const { data: saleData, error } = await supabase
          .from('sales')
          .insert({
            site_id: payload.site_id,
            customer_id: payload.customer_id,
            date: payload.date,
            payment_method: payload.payment_method,
            total_amount: payload.total_amount,
          })
          .select()
          .single();
        if (error) throw error;

        if (itemsWithTotals.length > 0) {
          const { error: itemsError } = await supabase.from('sale_items').insert(
            itemsWithTotals.map(item => ({ ...item, sale_id: saleData.id }))
          );
          if (itemsError) throw itemsError;
        }

        await logAudit(
          appUser?.name || 'Système',
          'CREATE',
          'sale',
          saleData.reference || '',
          `Création de la vente ${saleData.reference}`,
        );
        toast.show('Vente créée avec succès');
      }
      refresh();
    },
    onSuccess: () => { setModalOpen(false); setEditSale(null); },
    onError: (err) => toast.show('Erreur: ' + err.message, 'error'),
    isEdit: !!editSale,
  });

  // Memoize typed form items for the Articles FormSection
  const formItems = useMemo(() => form.items as SaleItem[], [form.items]);

  const openCreate = useCallback(() => {
    resetForm();
    setEditSale(null);
    setModalOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((sale: SaleWithRelations) => {
    setEditSale(sale);
    setForm('site_id', sale.site_id || '');
    setForm('customer_id', sale.customer_id || '');
    setForm('date', sale.date);
    setForm('payment_method', (sale.payment_method || 'espèces') as PaymentMethod);
    const items = (sale.items || []).map(item => ({
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit || 'kg',
      unit_price: item.unit_price,
      total: item.total,
    }));
    setForm('items', items.length > 0 ? items : DEFAULT_VALUES.items);
    setModalOpen(true);
  }, [setForm]);

  const openDetail = useCallback((sale: SaleWithRelations) => {
    setDetailSale(sale);
  }, []);

  const handleDelete = useCallback(
    (sale: SaleWithRelations) => {
      setConfirmDelete(sale);
    },
    [],
  );

  const handleDeleteConfirmed = useCallback(async (sale: SaleWithRelations) => {
    const { error } = await supabase.from('sales').delete().eq('id', sale.id);
    if (error) {
      toast.show('Erreur: ' + error.message, 'error');
    } else {
      await logAudit(
        appUser?.name || 'Système',
        'DELETE',
        'sale',
        sale.reference || '',
        `Vente ${sale.reference} supprimée`,
      );
      toast.show('Vente supprimée');
      setDetailSale(null);
      refresh();
    }
  }, [appUser, refresh, toast]);

  const getSaleName = (s: SaleWithRelations) => s.reference || `Vente ${s.id.slice(0, 8)}`;

  const getBadgeColor = (status: string) => {
    if (status === 'payée') return 'green';
    if (status === 'en_attente') return 'amber';
    if (status === 'annulée') return 'red';
    return 'gray';
  };

  const renderSaleFront = (sale: SaleWithRelations) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">{sale.reference || `VTE-${new Date(sale.date).getFullYear()}-${sale.id.slice(-5)}`}</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{formatCurrency(sale.total_amount || 0)}</p>
            <p className="text-sm text-slate-600">{sale.customer?.name || 'Client inconnu'} {sale.customer?.type ? `(${sale.customer.type})` : ''}</p>
          </div>
          <span className={`module-badge module-badge-${getBadgeColor(sale.status || 'en_attente')}`}>
            {statusLabel(sale.status || 'en_attente')}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> <span className="text-slate-500">Date :</span> <span className="font-medium">{formatDate(sale.date)}</span></p>
          <p className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> <span className="text-slate-500">Site :</span> <span className="font-medium">{sale.site?.name || '—'}</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200">
        <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
      </div>
    </div>
  );

  const renderSaleBack = (sale: SaleWithRelations) => (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-slate-900 mb-3">Détails de la vente</h3>
        <p><span className="text-slate-500">Référence :</span> {sale.reference || '—'}</p>
        <p><span className="text-slate-500">Date :</span> {formatDate(sale.date)}</p>
        <p><span className="text-slate-500">Client :</span> {sale.customer?.name || '—'}</p>
        <p><span className="text-slate-500">Site :</span> {sale.site?.name || '—'}</p>
        <p><span className="text-slate-500">Paiement :</span> {paymentMethodLabels[sale.payment_method || 'espèces']}</p>
        <p><span className="text-slate-500">Statut :</span> {statusLabel(sale.status || 'en_attente')}</p>
        <p><span className="text-slate-500">Montant :</span> {formatCurrency(sale.total_amount || 0)}</p>
        {(sale.items && sale.items.length > 0) && (
          <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Articles</p>
            {sale.items.map((item, idx) => (
              <p key={idx} className="text-xs text-slate-600">
                {item.description} — {item.quantity} {item.unit} × {formatCurrency(item.unit_price)} = {formatCurrency(item.total)}
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openDetail(sale); }}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Eye size={16} /> Détails
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openEdit(sale); }}
            className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
          >
            <Pencil size={14} /> Modifier
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(sale); }}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailFields = (sale: SaleWithRelations) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Référence</p>
          <p className="font-mono text-slate-900">{sale.reference || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Date</p>
          <p className="text-slate-900">{formatDate(sale.date)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Client</p>
          <p className="text-slate-900">{sale.customer?.name || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Type client</p>
          <p className="text-slate-900 capitalize">{sale.customer?.type || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Site</p>
          <p className="text-slate-900">{sale.site?.name || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Paiement</p>
          <p className="text-slate-900 capitalize">{paymentMethodLabels[sale.payment_method || 'espèces']}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Statut</p>
          <p className={`text-slate-900 font-medium ${sale.status === 'payée' ? 'text-green-600' : sale.status === 'annulée' ? 'text-red-600' : 'text-amber-600'}`}>
            {statusLabel(sale.status || 'en_attente')}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Montant total</p>
          <p className="text-slate-900 font-bold">{formatCurrency(sale.total_amount)}</p>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Articles</p>
        <div className="space-y-2">
          {sale.items && sale.items.length > 0 ? (
            sale.items.map((item, i) => (
              <div key={item.id || i} className="p-3 bg-white rounded-lg border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.description || 'Article'}</p>
                    <p className="text-xs text-slate-500">{item.quantity} {item.unit} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="font-semibold text-slate-900 ml-4 whitespace-nowrap">{formatCurrency(item.total)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">Aucun article</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderClientsTab = () => {
    const clientsWithSales = customers.filter(c => sales.some(s => s.customer_id === c.id));
    if (clientsWithSales.length === 0) {
      return (
        <div className="module-empty-state">
          <Users size={48} className="module-empty-icon" />
          <h3 className="module-empty-title">Aucun client avec ventes</h3>
          <p className="module-empty-message">Les clients apparaîtront ici après leur première vente.</p>
        </div>
      );
    }
    return (
      <div className="module-cards-grid">
        {clientsWithSales.map((client) => {
          const clientSales = sales.filter(s => s.customer_id === client.id);
          const clientRevenue = clientSales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
          const clientSalesCount = clientSales.length;
          const lastSale = clientSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          return (
            <RotatingCard
              key={client.id}
              flipLabel="Détails"
              backLabel="Retour"
              front={
                <div className="h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{client.name}</h3>
                        <p className="text-sm text-slate-500 capitalize">{client.type || 'particulier'}</p>
                      </div>
                      <span className="module-badge module-badge-blue">Client</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-slate-500">Achats :</span> <span className="font-medium">{clientSalesCount}</span></p>
                      <p><span className="text-slate-500">CA total :</span> <span className="font-medium">{formatCurrency(clientRevenue)}</span></p>
                      <p><span className="text-slate-500">Dernier achat :</span> <span className="font-medium">{lastSale ? formatDate(lastSale.date) : '—'}</span></p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-200">
                    <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
                  </div>
                </div>
              }
              back={
                <div className="h-full flex flex-col justify-between">
                  <div className="space-y-2 text-sm">
                    <h3 className="font-semibold text-slate-900 mb-3">{client.name}</h3>
                    <p><span className="text-slate-500">Type :</span> <span className="capitalize">{client.type || 'particulier'}</span></p>
                    <p><span className="text-slate-500">Téléphone :</span> {client.phone || '—'}</p>
                    <p><span className="text-slate-500">Email :</span> {client.email || '—'}</p>
                    <p><span className="text-slate-500">Nombre d'achats :</span> {clientSalesCount}</p>
                    <p><span className="text-slate-500">CA total :</span> {formatCurrency(clientRevenue)}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/finance?client=${client.id}`); }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Eye size={16} /> Voir historique
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openCreate(); }}
                      className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Nouvelle vente
                    </button>
                  </div>
                </div>
              }
            />
          );
        })}
      </div>
    );
  };

  const renderParMoisTab = () => {
    const salesByMonth = useMemo(() => {
      const map = new Map<string, { month: string; revenue: number; count: number }>();
      filteredSales.forEach(sale => {
        const date = new Date(sale.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = map.get(key) || { month: key, revenue: 0, count: 0 };
        existing.revenue += sale.total_amount || 0;
        existing.count += 1;
        map.set(key, existing);
      });
      return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
    }, [filteredSales]);

    if (salesByMonth.length === 0) {
      return (
        <div className="module-empty-state">
          <Calendar size={48} className="module-empty-icon" />
          <h3 className="module-empty-title">Aucune vente sur la période</h3>
          <p className="module-empty-message">Les ventes mensuelles apparaîtront ici.</p>
        </div>
      );
    }
    return (
      <div className="module-cards-grid">
        {salesByMonth.map((monthData) => (
          <RotatingCard
            key={monthData.month}
            flipLabel="Détails"
            backLabel="Retour"
            front={
              <div className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{monthData.month}</h3>
                      <p className="text-sm text-slate-500">Mois complet</p>
                    </div>
                    <span className="module-badge module-badge-green">Mensuel</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-slate-500">CA :</span> <span className="font-medium">{formatCurrency(monthData.revenue)}</span></p>
                    <p><span className="text-slate-500">Nb ventes :</span> <span className="font-medium">{monthData.count}</span></p>
                    <p><span className="text-slate-500">Panier moyen :</span> <span className="font-medium">{formatCurrency(monthData.count > 0 ? monthData.revenue / monthData.count : 0)}</span></p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-200">
                  <p className="text-sm text-emerald-700 font-medium">Voir les détails →</p>
                </div>
              </div>
            }
            back={
              <div className="h-full flex flex-col justify-between">
                <div className="space-y-2 text-sm">
                  <h3 className="font-semibold text-slate-900 mb-3">{monthData.month}</h3>
                  <p><span className="text-slate-500">Chiffre d'affaires :</span> {formatCurrency(monthData.revenue)}</p>
                  <p><span className="text-slate-500">Nombre de ventes :</span> {monthData.count}</p>
                  <p><span className="text-slate-500">Panier moyen :</span> {formatCurrency(monthData.count > 0 ? monthData.revenue / monthData.count : 0)}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-200">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate(`/app/finance?period=${monthData.month}`); }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> Voir les ventes du mois
                  </button>
                </div>
              </div>
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="module-page">
      {/* ========== HEADER ========== */}
      <header className="module-header">
        <div className="module-header-left">
          <h1>Ventes</h1>
          <p className="module-subtitle">Gestion des ventes, clients et suivi mensuel</p>
        </div>
        <div className="module-header-right">
          {!isGlobalView && effectiveSiteId && (
            <span className="module-badge module-badge-blue mr-2">
              {availableSites.find(s => s.id === effectiveSiteId)?.name || 'Site'}
            </span>
          )}
          <button
            onClick={openCreate}
            className="module-btn module-btn-primary"
          >
            <Plus size={16} /> Nouvelle vente
          </button>
        </div>
      </header>

      {/* ========== KPI GRID ========== */}
      <div className="module-kpi-grid">
        {kpis.map((kpi, index) => (
          <div key={index} className="module-kpi-card" style={{ borderLeftColor: kpi.iconColor }}>
            <div className="module-kpi-header">
              <div className="module-kpi-icon" style={{ backgroundColor: `${kpi.iconColor}15`, color: kpi.iconColor }}>
                {index === 0 && <TrendingUp size={20} />}
                {index === 1 && <ShoppingBag size={20} />}
                {index === 2 && <CreditCard size={20} />}
                {index === 3 && <Users size={20} />}
              </div>
            </div>
            <div className="module-kpi-body">
              <p className="module-kpi-label">{kpi.label}</p>
              <div className="module-kpi-value" style={{ color: kpi.iconColor }}>
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========== TABS ========== */}
      <div className="module-tabs" role="tablist" aria-label="Sections Ventes">
        <button
          role="tab"
          aria-selected={activeTab === 'ventes'}
          onClick={() => setActiveTab('ventes')}
          className={`module-tab ${activeTab === 'ventes' ? 'active' : ''}`}
        >
          <ShoppingBag size={14} className="mr-1" /> Ventes
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'clients'}
          onClick={() => setActiveTab('clients')}
          className={`module-tab ${activeTab === 'clients' ? 'active' : ''}`}
        >
          <Users size={14} className="mr-1" /> Clients
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'par_mois'}
          onClick={() => setActiveTab('par_mois')}
          className={`module-tab ${activeTab === 'par_mois' ? 'active' : ''}`}
        >
          <Calendar size={14} className="mr-1" /> Par mois
        </button>
      </div>

      {/* ========== SECTION ========== */}
      <section className="module-section" aria-labelledby="ventes-title">
        <div className="module-section-header">
          <h2 className="module-section-title" id="ventes-title">
            {activeTab === 'ventes' && 'Ventes enregistrées'}
            {activeTab === 'clients' && 'Clients avec achats'}
            {activeTab === 'par_mois' && 'Ventes par mois'}
          </h2>
        </div>

        {activeTab === 'ventes' && (
          <div className="module-search-wrapper mb-4">
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par référence, client, site, article…"
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
        )}

        {activeTab === 'ventes' && filteredSales.length === 0 && (
          <div className="module-empty-state">
            <ShoppingBag size={48} className="module-empty-icon" />
            <h3 className="module-empty-title">Aucune vente</h3>
            <p className="module-empty-message">
              {searchTerm ? 'Aucune vente ne correspond à la recherche.' : 'Créez votre première vente pour commencer.'}
            </p>
            <button
              onClick={openCreate}
              className="module-btn module-btn-primary"
            >
              <Plus size={14} /> Créer une vente
            </button>
          </div>
        )}

        {activeTab === 'ventes' && filteredSales.length > 0 && (
          <div className="module-cards-grid">
            {filteredSales.map((sale, index) => (
              <RotatingCard
                key={sale.id}
                flipLabel="Détails"
                backLabel="Retour"
                front={renderSaleFront(sale)}
                back={renderSaleBack(sale)}
              />
            ))}
          </div>
        )}

        {activeTab === 'clients' && renderClientsTab()}

        {activeTab === 'par_mois' && renderParMoisTab()}
      </section>

      {/* ========== MODALS ========== */}
      <DetailModal
        entity={detailSale}
        onClose={() => setDetailSale(null)}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
        title="Fiche de la vente"
        size="lg"
        renderFields={renderDetailFields}
      />

      <Modal
        open={modalOpen}
        onClose={() => { resetForm(); setModalOpen(false); setEditSale(null); }}
        title={editSale ? 'Éditer la vente' : 'Nouvelle vente'}
        size="xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormSection title="Essentiel">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Site" required error={errors.site_id}>
                <FormSelect
                  value={form.site_id}
                  onChange={e => setForm('site_id', e.target.value)}
                >
                  <option value="">Sélectionner un site</option>
                  {availableSites.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Client" required error={errors.customer_id}>
                <FormSelect
                  value={form.customer_id}
                  onChange={e => setForm('customer_id', e.target.value)}
                >
                  <option value="">Sélectionner un client</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.type ? `(${c.type})` : ''}</option>
                  ))}
                </FormSelect>
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Date" required error={errors.date}>
                <FormInput
                  type="date"
                  value={form.date}
                  onChange={e => setForm('date', e.target.value)}
                />
              </FormField>
              <FormField label="Mode de paiement" required error={errors.payment_method}>
                <FormSelect
                  value={form.payment_method}
                  onChange={e => setForm('payment_method', e.target.value as 'espèces' | 'virement' | 'chèque' | 'mobile money' | 'carte')}
                >
                  <option value="espèces">Espèces</option>
                  <option value="virement">Virement</option>
                  <option value="chèque">Chèque</option>
                  <option value="mobile money">Mobile Money</option>
                  <option value="carte">Carte</option>
                </FormSelect>
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Articles">
            <div className="space-y-4">
              {(() => {
                const items: SaleItem[] = form.items;
                return (
                  <>
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 md:col-span-4">
                          <FormField label="Description" error={errors.items?.[idx]?.description}>
                            <FormInput
                              value={item.description}
                              onChange={e => setForm('items', items.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))}
                            />
                          </FormField>
                        </div>
                        <div className="col-span-12 md:col-span-2">
                          <FormField label="Quantité" error={errors.items?.[idx]?.quantity}>
                            <FormInput
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={item.quantity}
                              onChange={e => setForm('items', items.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) || 0 } : it))}
                            />
                          </FormField>
                        </div>
                        <div className="col-span-12 md:col-span-2">
                          <FormField label="Unité" error={errors.items?.[idx]?.unit}>
                            <FormSelect
                              value={item.unit}
                              onChange={e => setForm('items', items.map((it, i) => i === idx ? { ...it, unit: e.target.value } : it))}
                            >
                              <option value="kg">kg</option>
                              <option value="tonne">tonne</option>
                              <option value="unité">unité</option>
                              <option value="litre">litre</option>
                              <option value="sac">sac</option>
                            </FormSelect>
                          </FormField>
                        </div>
                        <div className="col-span-12 md:col-span-3">
                          <FormField label="Prix unitaire" error={errors.items?.[idx]?.unit_price}>
                            <FormInput
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={e => setForm('items', items.map((it, i) => i === idx ? { ...it, unit_price: Number(e.target.value) || 0 } : it))}
                            />
                          </FormField>
                        </div>
                        <div className="col-span-12 md:col-span-1">
                          <button
                            type="button"
                            onClick={() => setForm('items', items.filter((_, i) => i !== idx))}
                            className="w-full h-10 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 flex items-center justify-center"
                            disabled={items.length <= 1}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setForm('items', [...items, { description: '', quantity: 1, unit: 'kg', unit_price: 0, total: 0 }])}
                      className="module-btn module-btn-secondary"
                    >
                      <Plus size={14} /> Ajouter un article
                    </button>
                  </>
                );
              })()}
            </div>
          </FormSection>

          <FormActions onSubmit={handleFormSubmit} onCancel={() => { resetForm(); setModalOpen(false); setEditSale(null); }} isSubmitting={isSubmitting} />
        </form>
      </Modal>

      <ConfirmDeleteModal
        entity={confirmDelete}
        onConfirm={() => confirmDelete && handleDeleteConfirmed(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        getEntityName={getSaleName}
      />
    </div>
  );
}

export default SalesModule;