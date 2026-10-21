import { useState, useMemo, useCallback } from 'react';
import { ShoppingBag, Wheat, MapPin, CreditCard, Eye, Edit, Filter, ChevronDown, Plus, TrendingUp, Users, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { formatCurrency, formatDate } from '@/lib/format';
import { useSalesData } from './hooks/useSalesData';
import { useToast } from '@/lib/Toast';
import { supabase } from '@/lib/supabase';
import type { SaleWithRelations } from './hooks/useSalesData';
import { SaleFormModal } from './components/SaleFormModal';

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = useMemo(() => {
    switch (status?.toLowerCase()) {
      case 'payée':
      case 'paye':
      case 'paid':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Payée' };
      case 'en attente':
      case 'en_attente':
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente' };
      case 'annulée':
      case 'annulee':
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Annulée' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', label: status };
    }
  }, [status]);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function SaleCardFront({ sale, index }: { sale: SaleWithRelations; index: number }) {
  const isCrop = sale.items?.some(item => item.description?.toLowerCase().includes('maïs') || item.description?.toLowerCase().includes('mais') || item.description?.toLowerCase().includes('blé') || item.description?.toLowerCase().includes('ble') || item.description?.toLowerCase().includes('riz')) ?? false;

  return (
    <div className="h-full flex flex-col p-5 bg-white">
      {/* Header: badge statut + référence */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <StatusBadge status={sale.status || 'en_attente'} />
        <div className="text-right">
          <p className="text-xs text-slate-500 font-mono">#{index + 1}</p>
          <p className="text-xs text-slate-400 font-mono">{sale.reference || '—'}</p>
        </div>
      </div>

      {/* Centre: montant + client */}
      <div className="flex-1 flex flex-col justify-center mb-4">
        <p className="text-2xl font-bold text-slate-900">{formatCurrency(sale.total_amount)}</p>
        <p className="text-sm text-slate-600 mt-1 truncate">{sale.customer?.name || 'Client inconnu'}</p>
        {sale.customer?.type && (
          <p className="text-xs text-slate-500 capitalize">{sale.customer.type}</p>
        )}
      </div>

      {/* Bas: date + site + icône type */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} />
          <span>{sale.site?.name || '—'}</span>
          {sale.site?.code && (
            <>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-slate-400">{sale.site.code}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>{formatDate(sale.date)}</span>
          {isCrop ? <Wheat size={14} /> : <ShoppingBag size={14} />}
        </div>
      </div>
    </div>
  );
}

interface SaleCardBackProps {
  sale: SaleWithRelations;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SaleCardBack({ sale, onViewDetails, onEdit, onDelete }: SaleCardBackProps) {
  return (
    <div className="h-full p-5 bg-slate-50 overflow-y-auto">
      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <ShoppingBag size={18} className="text-green-600" />
        Détails de la vente
      </h4>

      {/* Référence + client + date */}
      <div className="space-y-2 mb-4 p-3 bg-white rounded-lg border border-slate-100">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-slate-500">Référence</p>
            <p className="font-mono text-slate-900">{sale.reference || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500">Date</p>
            <p className="font-medium text-slate-900">{formatDate(sale.date)}</p>
          </div>
          <div>
            <p className="text-slate-500">Client</p>
            <p className="font-medium text-slate-900">{sale.customer?.name || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500">Site</p>
            <p className="font-medium text-slate-900">{sale.site?.name || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500">Paiement</p>
            <p className="font-medium text-slate-900 capitalize">{sale.payment_method || 'espèces'}</p>
          </div>
        </div>
      </div>

      {/* Lignes de vente */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Articles</p>
        <div className="space-y-2">
          {sale.items && sale.items.length > 0 ? (
            sale.items.map((item, i) => (
              <div key={item.id || i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{item.description || 'Article'}</p>
                  <p className="text-xs text-slate-500">{item.quantity} {item.unit} × {formatCurrency(item.unit_price)}</p>
                </div>
                <p className="font-semibold text-slate-900 ml-4 whitespace-nowrap">{formatCurrency(item.total)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">Aucun article</p>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <span className="font-semibold text-slate-700">Total</span>
        <span className="text-xl font-bold text-slate-900">{formatCurrency(sale.total_amount)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
        <button onClick={onViewDetails} className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
          <Eye size={14} /> Voir détails
        </button>
        <button onClick={onEdit} className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
          <Edit size={14} /> Modifier
        </button>
        <button onClick={onDelete} className="py-2 px-4 bg-red-100 text-red-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-200 transition-colors" title="Supprimer">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function SalesFilters({
  selectedSite,
  selectedStatus,
  selectedPeriod,
  sites,
  onSiteChange,
  onStatusChange,
  onPeriodChange,
}: {
  selectedSite: string;
  selectedStatus: string;
  selectedPeriod: string;
  sites: Array<{ id: string; name: string; code: string | null }>;
  onSiteChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onPeriodChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-200">
      {/* Filtre site */}
      <div className="relative">
        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <select
          value={selectedSite}
          onChange={e => onSiteChange(e.target.value)}
          className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Tous les sites</option>
          {sites.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} {s.code ? `(${s.code})` : ''}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {/* Filtre statut */}
      <div className="relative">
        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <select
          value={selectedStatus}
          onChange={e => onStatusChange(e.target.value)}
          className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Tous les statuts</option>
          <option value="payée">Payée</option>
          <option value="en_attente">En attente</option>
          <option value="annulée">Annulée</option>
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {/* Filtre période */}
      <div className="relative">
        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <select
          value={selectedPeriod}
          onChange={e => onPeriodChange(e.target.value)}
          className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="month">Ce mois</option>
          <option value="quarter">Ce trimestre</option>
          <option value="year">Cette année</option>
          <option value="all">Tout</option>
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

export const SalesModule = () => {
  const { sales, customers, stats, loading, error, refresh } = useSalesData();
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const toast = useToast();

  // Sites uniques pour le filtre
  const sites = useMemo(() => {
    const siteMap = new Map<string, { id: string; name: string; code: string | null }>();
    sales.forEach(s => {
      if (s.site?.id && !siteMap.has(s.site.id)) {
        siteMap.set(s.site.id, { id: s.site.id, name: s.site.name, code: s.site.code });
      }
    });
    return Array.from(siteMap.values());
  }, [sales]);

  // Filtrer les ventes
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (selectedSite && sale.site_id !== selectedSite) return false;
      if (selectedStatus && sale.status !== selectedStatus) return false;
      if (selectedPeriod !== 'all') {
        const saleDate = new Date(sale.date);
        const now = new Date();
        if (selectedPeriod === 'month') {
          if (saleDate.getMonth() !== now.getMonth() || saleDate.getFullYear() !== now.getFullYear()) return false;
        } else if (selectedPeriod === 'quarter') {
          const saleQuarter = Math.floor(saleDate.getMonth() / 3);
          const currentQuarter = Math.floor(now.getMonth() / 3);
          if (saleQuarter !== currentQuarter || saleDate.getFullYear() !== now.getFullYear()) return false;
        } else if (selectedPeriod === 'year') {
          if (saleDate.getFullYear() !== now.getFullYear()) return false;
        }
      }
      return true;
    });
  }, [sales, selectedSite, selectedStatus, selectedPeriod]);

  // État pour la modale de formulaire
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<{
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
  } | null>(null);

  // Ouvrir la modale en mode création
  const openCreateModal = useCallback(() => {
    setSaleToEdit(null);
    setIsFormOpen(true);
  }, []);

  // Ouvrir la modale en mode édition
  const openEditModal = useCallback((sale: SaleWithRelations) => {
    setSaleToEdit({
      id: sale.id,
      site_id: sale.site_id || '',
      customer_id: sale.customer_id || '',
      date: sale.date,
      payment_method: sale.payment_method,
      items: (sale.items || []).map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total: item.total,
      })),
    });
    setIsFormOpen(true);
  }, []);

  // Fermer la modale
  const closeModal = useCallback(() => {
    setIsFormOpen(false);
    setSaleToEdit(null);
  }, []);

  // Rafraîchir après succès
  const handleFormSuccess = useCallback(() => {
    refresh();
    closeModal();
  }, [refresh, closeModal]);

  // Supprimer une vente
  const handleDelete = useCallback(async (sale: SaleWithRelations) => {
    const confirmed = window.confirm(`Supprimer la vente "${sale.reference}" ? Cette action est irréversible.`);
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('sales').delete().eq('id', sale.id);
      if (error) throw error;
      toast.show('Vente supprimée', 'success');
      refresh();
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.show('Erreur lors de la suppression', 'error');
    }
  }, [refresh, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ventes</h1>
            <p className="text-slate-500">Gestion des ventes et clients</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <KpiCard key={i} label="..." value="—" icon={<TrendingUp size={20} />} />
          ))}
        </div>
        <div className="h-96 bg-slate-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ShoppingBag size={48} className="mx-auto mb-4 text-slate-300" />
        <p className="text-lg font-medium text-slate-900">Erreur de chargement</p>
        <p className="text-sm text-slate-500 mt-1">{error.message}</p>
        <button onClick={refresh} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ventes</h1>
          <p className="text-slate-500 mt-1">Gestion des ventes et clients</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreateModal} className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Nouvelle vente
          </button>
          <button onClick={() => { refresh(); toast.show('Données actualisées', 'success'); }} className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium text-sm text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Chiffre d'affaires"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={<TrendingUp size={20} className="text-green-600" />}
          trend={{ value: '+', positive: true }}
        />
        <KpiCard
          label="Nombre de ventes"
          value={String(stats?.salesCount || 0)}
          icon={<ShoppingBag size={20} className="text-blue-600" />}
        />
        <KpiCard
          label="Panier moyen"
          value={formatCurrency(stats?.avgSale || 0)}
          icon={<CreditCard size={20} className="text-purple-600" />}
        />
        <KpiCard
          label="Clients actifs"
          value={String(customers.length)}
          icon={<Users size={20} className="text-orange-600" />}
        />
        <KpiCard
          label="Sites actifs"
          value={String(sites.length)}
          icon={<MapPin size={20} className="text-teal-600" />}
        />
      </div>

      {/* Filtres */}
      <SalesFilters
        selectedSite={selectedSite}
        selectedStatus={selectedStatus}
        selectedPeriod={selectedPeriod}
        sites={sites}
        onSiteChange={setSelectedSite}
        onStatusChange={setSelectedStatus}
        onPeriodChange={setSelectedPeriod}
      />

      {/* Grille de cartes rotatives */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-900">Aucune vente</p>
            <p className="text-sm text-slate-500 mt-1">
              {selectedSite || selectedStatus || selectedPeriod !== 'all'
                ? 'Aucune vente ne correspond aux filtres sélectionnés.'
                : 'Créez votre première vente pour commencer.'}
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSales.map((sale, index) => (
                <RotatingCard
                  key={sale.id}
                  flipLabel="Détails"
                  backLabel="Retour"
                  className="h-72"
                  front={<SaleCardFront sale={sale} index={index} />}
                  back={<SaleCardBack
                    sale={sale}
                    onViewDetails={() => toast.show(`Détails de la vente ${sale.reference}`, 'info')}
                    onEdit={() => openEditModal(sale)}
                    onDelete={() => handleDelete(sale)}
                  />}
                />
              ))}
            </div>
            {filteredSales.length < sales.length && (
              <p className="text-sm text-slate-500 text-center mt-4">
                Affichage de {filteredSales.length} sur {sales.length} ventes
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modale formulaire vente */}
      <SaleFormModal
        isOpen={isFormOpen}
        onClose={closeModal}
        onSuccess={handleFormSuccess}
        saleToEdit={saleToEdit}
      />
    </div>
  );
};