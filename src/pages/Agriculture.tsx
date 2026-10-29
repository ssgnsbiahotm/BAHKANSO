import { useMemo, useState, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { useToast } from '@/lib/Toast';
import { Eye, Pencil, Trash2, Plus, Wheat, Tractor, Scale } from 'lucide-react';

import '@/styles/module-theme.css';

type AgricultureTab = 'plots' | 'campaigns' | 'operations' | 'harvests';

const AGRICULTURE_TABS: AgricultureTab[] = ['plots', 'campaigns', 'operations', 'harvests'];

export function Agriculture() {
  const { plots, campaigns, cropOperations, harvests, refresh } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<AgricultureTab>('plots');
  const navigate = useNavigate();

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = AGRICULTURE_TABS.indexOf(tab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % AGRICULTURE_TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + AGRICULTURE_TABS.length) % AGRICULTURE_TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = AGRICULTURE_TABS.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    const nextTab = AGRICULTURE_TABS[nextIndex];
    setTab(nextTab);
    document.getElementById(`agriculture-tab-${nextTab}`)?.focus();
  };

  const handleDeletePlot = async (id: string) => {
    if (!window.confirm('Supprimer cette parcelle ? Cette action est irréversible.')) return;
    try {
      const { error } = await supabase.from('plots').delete().eq('id', id);
      if (error) throw error;
      toast.show('Parcelle supprimée', 'success');
      refresh?.();
    } catch (err: any) {
      console.error(err);
      toast.show('Erreur: ' + err.message, 'error');
    }
  };

  const handleEditPlot = (plotId: string) => {
    navigate('/app/exploitation/parcelles?select=' + plotId + '&action=edit');
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Supprimer cette campagne ? Cette action est irréversible.')) return;
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      toast.show('Campagne supprimée', 'success');
      refresh?.();
    } catch (err: any) {
      console.error(err);
      toast.show('Erreur: ' + err.message, 'error');
    }
  };

  const handleEditCampaign = (campaignId: string) => {
    navigate('/app/exploitation/campagnes?select=' + campaignId + '&action=edit');
  };

  const handleDeleteOperation = async (id: string) => {
    if (!window.confirm('Supprimer cette opération ? Cette action est irréversible.')) return;
    try {
      const { error } = await supabase.from('crop_operations').delete().eq('id', id);
      if (error) throw error;
      toast.show('Opération supprimée', 'success');
      refresh?.();
    } catch (err: any) {
      console.error(err);
      toast.show('Erreur: ' + err.message, 'error');
    }
  };

  const handleEditOperation = (operationId: string) => {
    navigate('/app/exploitation/operations?select=' + operationId + '&action=edit');
  };

  const handleDeleteHarvest = async (id: string) => {
    if (!window.confirm('Supprimer cette récolte ? Cette action est irréversible.')) return;
    try {
      const { error } = await supabase.from('harvests').delete().eq('id', id);
      if (error) throw error;
      toast.show('Récolte supprimée', 'success');
      refresh?.();
    } catch (err: any) {
      console.error(err);
      toast.show('Erreur: ' + err.message, 'error');
    }
  };

  const handleEditHarvest = (harvestId: string) => {
    navigate('/app/exploitation/recoltes?select=' + harvestId + '&action=edit');
  };

  const kpis = useMemo(() => {
    const totalArea = plots.reduce((s, p) => s + (p.area_hectares || 0), 0);
    const activeParcels = {
      active: plots.filter(p => p.status === 'actif' || p.status === 'active').length,
      total: plots.length
    };
    const totalOps = cropOperations.length;
    const totalHarvest = harvests.reduce((s, h) => s + (h.quantity || 0), 0);
    const totalRevenue = harvests.reduce((s, h) => s + (h.revenue || 0), 0);
    return { totalArea, activeParcels, totalOps, totalHarvest, totalRevenue };
  }, [plots, cropOperations, harvests]);

  const statusLabel = (status: string) => {
    if (status === 'actif' || status === 'active') return 'Actif';
    if (status === 'inactive') return 'Inactif';
    if (status === 'en préparation') return 'En préparation';
    return status;
  };

  const campaignStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planned: 'Planifiée',
      planted: 'Plantée',
      growing: 'En croissance',
      harvested: 'Récoltée',
      completed: 'Terminée',
    };
    return labels[status] || status;
  };

  const operationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      semis: 'Semis',
      traitement: 'Traitement',
      fertilisation: 'Fertilisation',
      irrigation: 'Irrigation',
      recolte: 'Récolte',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  const harvestQualityLabel = (quality: string) => {
    const labels: Record<string, string> = {
      excellente: 'Excellente',
      bonne: 'Bonne',
      moyenne: 'Moyenne',
      faible: 'Faible',
    };
    return labels[quality] || quality;
  };

  const getBadgeColor = (status: string) => {
    if (status === 'actif' || status === 'active') return 'green';
    if (status === 'inactive') return 'gray';
    if (status === 'en préparation') return 'amber';
    if (status === 'planned') return 'gray';
    if (status === 'planted') return 'blue';
    if (status === 'growing') return 'green';
    if (status === 'harvested') return 'amber';
    if (status === 'completed') return 'green';
    return 'gray';
  };

  const renderPlotFront = (p: any) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{p.name}</h3>
            <p className="text-sm text-slate-500">{p.location || '—'}</p>
          </div>
          <span className={`module-badge module-badge-${getBadgeColor(p.status)}`}>
            {statusLabel(p.status)}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Culture :</span> <span className="font-medium">{p.current_crop || '—'}</span></p>
          <p><span className="text-slate-500">Superficie :</span> <span className="font-medium">{p.area_hectares} ha</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-sm text-emerald-700 font-medium">Retourner pour les actions →</p>
      </div>
    </div>
  );

  const renderPlotBack = (p: any) => (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-slate-900 mb-3">{p.name}</h3>
        <p><span className="text-slate-500">Culture :</span> {p.current_crop || '—'}</p>
        <p><span className="text-slate-500">Superficie :</span> {p.area_hectares} ha</p>
        <p><span className="text-slate-500">Type de sol :</span> {p.soil_type || '—'}</p>
        <p><span className="text-slate-500">Localisation :</span> {p.location || '—'}</p>
        <p><span className="text-slate-500">Référence :</span> {p.reference || '—'}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate('/app/exploitation/journal/' + p.id); }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Eye size={16} /> Ouvrir le journal
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleEditPlot(p.id); }}
            className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
          >
            <Pencil size={14} /> Modifier
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDeletePlot(p.id); }}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );

  const renderCampaignFront = (c: any) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{c.crop_name}</h3>
            <p className="text-sm text-slate-500">{c.plot?.name || '—'} • {c.year}</p>
          </div>
          <span className={`module-badge module-badge-${getBadgeColor(c.status)}`}>
            {campaignStatusLabel(c.status)}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Début :</span> <span className="font-medium">{formatDate(c.start_date)}</span></p>
          <p><span className="text-slate-500">Récolte prévue :</span> <span className="font-medium">{formatDate(c.expected_harvest_date)}</span></p>
          <p><span className="text-slate-500">Budget :</span> <span className="font-medium text-green-600">{formatCurrency(c.budget)}</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-sm text-emerald-700 font-medium">Retourner pour les actions →</p>
      </div>
    </div>
  );

  const renderCampaignBack = (c: any) => (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-slate-900 mb-3">{c.crop_name}</h3>
        <p><span className="text-slate-500">Année :</span> {c.year}</p>
        <p><span className="text-slate-500">Parcelle :</span> {c.plot?.name || '—'}</p>
        <p><span className="text-slate-500">Statut :</span> {campaignStatusLabel(c.status)}</p>
        <p><span className="text-slate-500">Début :</span> {formatDate(c.start_date)}</p>
        <p><span className="text-slate-500">Récolte prévue :</span> {formatDate(c.expected_harvest_date)}</p>
        <p><span className="text-slate-500">Budget :</span> {formatCurrency(c.budget)}</p>
        <p><span className="text-slate-500">Responsable :</span> {c.responsible || '—'}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate('/app/exploitation/campagnes?select=' + c.id + '&action=view'); }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Eye size={16} /> Voir détails
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleEditCampaign(c.id); }}
            className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
          >
            <Pencil size={14} /> Modifier
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.id); }}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );

  const renderOperationFront = (o: any) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{operationTypeLabel(o.type)}</h3>
            <p className="text-sm text-slate-500">{o.plot?.name || '—'} • {formatDate(o.date)}</p>
          </div>
          <span className="module-badge module-badge-green">{operationTypeLabel(o.type)}</span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Responsable :</span> <span className="font-medium">{o.responsible || '—'}</span></p>
          <p><span className="text-slate-500">Intrants :</span> <span className="font-medium">{o.inputs || '—'}</span></p>
          <p><span className="text-slate-500">Coût :</span> <span className="font-medium text-amber-600">{formatCurrency(o.cost)}</span></p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-sm text-emerald-700 font-medium">Retourner pour les actions →</p>
      </div>
    </div>
  );

  const renderOperationBack = (o: any) => (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-slate-900 mb-3">{operationTypeLabel(o.type)}</h3>
        <p><span className="text-slate-500">Date :</span> {formatDate(o.date)}</p>
        <p><span className="text-slate-500">Parcelle :</span> {o.plot?.name || '—'}</p>
        <p><span className="text-slate-500">Responsable :</span> {o.responsible || '—'}</p>
        <p><span className="text-slate-500">Intrants :</span> {o.inputs || '—'}</p>
        <p><span className="text-slate-500">Coût :</span> {formatCurrency(o.cost)}</p>
        <p><span className="text-slate-500">Main-d'œuvre :</span> {formatCurrency(o.labor_cost)}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate('/app/exploitation/operations?select=' + o.id + '&action=view'); }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Eye size={16} /> Voir détails
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleEditOperation(o.id); }}
            className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
          >
            <Pencil size={14} /> Modifier
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDeleteOperation(o.id); }}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );

  const renderHarvestFront = (h: any) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Récolte du {formatDate(h.date)}</h3>
          <span className={`module-badge module-badge-${getBadgeColor(h.quality)}`}>
            {harvestQualityLabel(h.quality)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-500">Quantité</span><p className="font-medium">{h.quantity} {h.unit}</p></div>
          <div><span className="text-slate-500">Prix estimé</span><p className="font-medium">{formatCurrency(h.estimated_price)}</p></div>
          <div><span className="text-slate-500">Chiffre d'affaires</span><p className="font-medium text-green-600">{formatCurrency(h.revenue)}</p></div>
          <div><span className="text-slate-500">Destination</span><p className="font-medium">{h.destination || '—'}</p></div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-sm text-emerald-700 font-medium">Retourner pour les actions →</p>
      </div>
    </div>
  );

  const renderHarvestBack = (h: any) => (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-slate-900 mb-3">Récolte du {formatDate(h.date)}</h3>
        <p><span className="text-slate-500">Quantité :</span> {h.quantity} {h.unit}</p>
        <p><span className="text-slate-500">Qualité :</span> {harvestQualityLabel(h.quality)}</p>
        <p><span className="text-slate-500">Prix estimé :</span> {formatCurrency(h.estimated_price)}</p>
        <p><span className="text-slate-500">Chiffre d'affaires :</span> {formatCurrency(h.revenue)}</p>
        <p><span className="text-slate-500">Destination :</span> {h.destination || '—'}</p>
        <p><span className="text-slate-500">Notes :</span> {h.notes || '—'}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate('/app/exploitation/recoltes?select=' + h.id + '&action=view'); }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Eye size={16} /> Voir détails
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleEditHarvest(h.id); }}
            className="flex-1 bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
          >
            <Pencil size={14} /> Modifier
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDeleteHarvest(h.id); }}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="module-page">
      {/* ========== HEADER ========== */}
      <header className="module-header">
        <div className="module-header-left">
          <h1>Agriculture</h1>
          <p className="module-subtitle">Gestion des parcelles, campagnes, opérations et récoltes</p>
        </div>
        <div className="module-header-right">
          <button
            onClick={() => navigate('/app/exploitation/parcelles')}
            className="module-btn module-btn-primary"
          >
            <Plus size={16} /> Nouvelle parcelle
          </button>
        </div>
      </header>

      {/* ========== KPI GRID ========== */}
      <div className="module-kpi-grid">
        <div className="module-kpi-card" style={{ borderLeftColor: '#B9D86B' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(185, 216, 107, 0.15)', color: '#B9D86B' }}>
              <Wheat size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Surface totale</p>
            <div className="module-kpi-value" style={{ color: '#B9D86B' }}>
              {kpis.totalArea.toFixed(1)} ha
            </div>
          </div>
        </div>
        <div className="module-kpi-card" style={{ borderLeftColor: '#8FD3F4' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(143, 211, 244, 0.15)', color: '#8FD3F4' }}>
              <Wheat size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Parcelles actives</p>
            <div className="module-kpi-value" style={{ color: '#8FD3F4' }}>
              {kpis.activeParcels.active} / {kpis.activeParcels.total}
            </div>
          </div>
        </div>
        <div className="module-kpi-card" style={{ borderLeftColor: '#F6B95C' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(246, 185, 92, 0.15)', color: '#F6B95C' }}>
              <Tractor size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Opérations</p>
            <div className="module-kpi-value" style={{ color: '#F6B95C' }}>
              {kpis.totalOps}
            </div>
          </div>
        </div>
        <div className="module-kpi-card" style={{ borderLeftColor: '#D4906A' }}>
          <div className="module-kpi-header">
            <div className="module-kpi-icon" style={{ backgroundColor: 'rgba(212, 144, 106, 0.15)', color: '#D4906A' }}>
              <Scale size={20} />
            </div>
          </div>
          <div className="module-kpi-body">
            <p className="module-kpi-label">Récoltes</p>
            <div className="module-kpi-value" style={{ color: '#D4906A' }}>
              {kpis.totalHarvest.toLocaleString('fr-FR')} kg
            </div>
          </div>
        </div>
      </div>

      {/* ========== TABS ========== */}
      <div className="module-tabs" role="tablist" aria-label="Sections Agriculture">
        <button
          id="agriculture-tab-plots"
          role="tab"
          aria-selected={tab === 'plots'}
          aria-controls="agriculture-panel-plots"
          tabIndex={tab === 'plots' ? 0 : -1}
          onClick={() => setTab('plots')}
          onKeyDown={handleTabKeyDown}
          className={`module-tab ${tab === 'plots' ? 'active' : ''}`}
        >
          Parcelles ({plots.length})
        </button>
        <button
          id="agriculture-tab-campaigns"
          role="tab"
          aria-selected={tab === 'campaigns'}
          aria-controls="agriculture-panel-campaigns"
          tabIndex={tab === 'campaigns' ? 0 : -1}
          onClick={() => setTab('campaigns')}
          onKeyDown={handleTabKeyDown}
          className={`module-tab ${tab === 'campaigns' ? 'active' : ''}`}
        >
          Campagnes ({campaigns.length})
        </button>
        <button
          id="agriculture-tab-operations"
          role="tab"
          aria-selected={tab === 'operations'}
          aria-controls="agriculture-panel-operations"
          tabIndex={tab === 'operations' ? 0 : -1}
          onClick={() => setTab('operations')}
          onKeyDown={handleTabKeyDown}
          className={`module-tab ${tab === 'operations' ? 'active' : ''}`}
        >
          Opérations ({cropOperations.length})
        </button>
        <button
          id="agriculture-tab-harvests"
          role="tab"
          aria-selected={tab === 'harvests'}
          aria-controls="agriculture-panel-harvests"
          tabIndex={tab === 'harvests' ? 0 : -1}
          onClick={() => setTab('harvests')}
          onKeyDown={handleTabKeyDown}
          className={`module-tab ${tab === 'harvests' ? 'active' : ''}`}
        >
          Récoltes ({harvests.length})
        </button>
      </div>

      {/* ========== PARCELLES ========== */}
      {tab === 'plots' && (
        <section id="agriculture-panel-plots" role="tabpanel" tabIndex={0} className="module-section" aria-labelledby="agriculture-tab-plots">
          <div className="module-section-header">
            <h2 className="module-section-title" id="plots-title">Parcelles agricoles</h2>
            <a
              href="/app/exploitation/parcelles"
              onClick={(e) => { e.preventDefault(); navigate('/app/exploitation/parcelles'); }}
              className="module-view-all-link"
            >
              Gestion détaillée <Eye size={14} />
            </a>
          </div>

          {plots.length === 0 ? (
            <div className="module-empty-state">
              <Wheat size={48} className="module-empty-icon" />
              <h3 className="module-empty-title">Aucune parcelle</h3>
              <p className="module-empty-message">
                Créez votre première parcelle pour commencer le suivi de vos cultures.
              </p>
              <button
                onClick={() => navigate('/app/exploitation/parcelles')}
                className="module-btn module-btn-primary"
              >
                <Plus size={14} /> Créer une parcelle
              </button>
            </div>
          ) : (
            <div className="module-cards-grid">
              {plots.map(p => (
                <RotatingCard
                  key={p.id}
                  flipLabel="Détails"
                  backLabel="Retour"
                  label={`Parcelle ${p.reference || p.name}`}
                  front={renderPlotFront(p)}
                  back={renderPlotBack(p)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========== CAMPAGNES ========== */}
      {tab === 'campaigns' && (
        <section id="agriculture-panel-campaigns" role="tabpanel" tabIndex={0} className="module-section" aria-labelledby="agriculture-tab-campaigns">
          <div className="module-section-header">
            <h2 className="module-section-title" id="campaigns-title">Campagnes culturales</h2>
            <a
              href="/app/exploitation/campagnes"
              onClick={(e) => { e.preventDefault(); navigate('/app/exploitation/campagnes'); }}
              className="module-view-all-link"
            >
              Gestion détaillée <Eye size={14} />
            </a>
          </div>

          {campaigns.length === 0 ? (
            <div className="module-empty-state">
              <Wheat size={48} className="module-empty-icon" />
              <h3 className="module-empty-title">Aucune campagne</h3>
              <p className="module-empty-message">
                Planifiez votre première campagne culturale pour organiser vos cultures sur l'année.
              </p>
              <button
                onClick={() => navigate('/app/exploitation/campagnes')}
                className="module-btn module-btn-primary"
              >
                <Plus size={14} /> Créer une campagne
              </button>
            </div>
          ) : (
            <div className="module-cards-grid">
              {campaigns.map(c => (
                <RotatingCard
                  key={c.id}
                  flipLabel="Détails"
                  backLabel="Retour"
                  label={`Campagne ${c.crop_name}`}
                  front={renderCampaignFront(c)}
                  back={renderCampaignBack(c)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========== OPERATIONS ========== */}
      {tab === 'operations' && (
        <section id="agriculture-panel-operations" role="tabpanel" tabIndex={0} className="module-section" aria-labelledby="agriculture-tab-operations">
          <div className="module-section-header">
            <h2 className="module-section-title" id="operations-title">Opérations culturales</h2>
            <a
              href="/app/exploitation/operations"
              onClick={(e) => { e.preventDefault(); navigate('/app/exploitation/operations'); }}
              className="module-view-all-link"
            >
              Gestion détaillée <Eye size={14} />
            </a>
          </div>

          {cropOperations.length === 0 ? (
            <div className="module-empty-state">
              <Tractor size={48} className="module-empty-icon" />
              <h3 className="module-empty-title">Aucune opération</h3>
              <p className="module-empty-message">
                Enregistrez vos interventions culturales (semis, traitements, irrigation, récolte...).
              </p>
              <button
                onClick={() => navigate('/app/exploitation/operations')}
                className="module-btn module-btn-primary"
              >
                <Plus size={14} /> Enregistrer une opération
              </button>
            </div>
          ) : (
            <div className="module-cards-grid">
              {cropOperations.map(o => (
                <RotatingCard
                  key={o.id}
                  flipLabel="Détails"
                  backLabel="Retour"
                  label={`Opération ${operationTypeLabel(o.type)}`}
                  front={renderOperationFront(o)}
                  back={renderOperationBack(o)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========== RECOLTES ========== */}
      {tab === 'harvests' && (
        <section id="agriculture-panel-harvests" role="tabpanel" tabIndex={0} className="module-section" aria-labelledby="agriculture-tab-harvests">
          <div className="module-section-header">
            <h2 className="module-section-title" id="harvests-title">Récoltes agricoles</h2>
            <a
              href="/app/exploitation/recoltes"
              onClick={(e) => { e.preventDefault(); navigate('/app/exploitation/recoltes'); }}
              className="module-view-all-link"
            >
              Gestion détaillée <Eye size={14} />
            </a>
          </div>

          {harvests.length === 0 ? (
            <div className="module-empty-state">
              <Scale size={48} className="module-empty-icon" />
              <h3 className="module-empty-title">Aucune récolte</h3>
              <p className="module-empty-message">
                Enregistrez vos récoltes pour suivre vos rendements et votre chiffre d'affaires.
              </p>
              <button
                onClick={() => navigate('/app/exploitation/recoltes')}
                className="module-btn module-btn-primary"
              >
                <Plus size={14} /> Enregistrer une récolte
              </button>
            </div>
          ) : (
            <div className="module-cards-grid">
              {harvests.map(h => (
                <RotatingCard
                  key={h.id}
                  flipLabel="Détails"
                  backLabel="Retour"
                  label={`Récolte du ${formatDate(h.date)}`}
                  front={renderHarvestFront(h)}
                  back={renderHarvestBack(h)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}