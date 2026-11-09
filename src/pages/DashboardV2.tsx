import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardKpiCard } from '@/components/ui/DashboardKpiCard';
import { DashboardTrendChart } from '@/components/ui/DashboardTrendChart';
import { DashboardActionList } from '@/components/ui/DashboardActionList';
import { formatDate } from '@/lib/format';
import { useSite } from '@/lib/SiteContext';
import { useData } from '@/lib/DataContext';

/**
 * Tableau de bord v2 — Derrière le flag `dashboard_v2`.
 *
 * Contexte global unique (site / période / campagne) porté par useDashboardScope,
 * pas de sélecteur local sur la page. Source des KPIs : event_journal (via
 * clientDataSource). États de donnée explicites : loading / no_data / ok / warn / crit.
 *
 * L'ancien dashboard (src/pages/Dashboard.tsx) reste intact derrière le flag OFF.
 */
export function DashboardV2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { siteId, period, campaignId, setSiteId, setPeriod, reset, loading, error, kpiNetResult, kpiGrossMargin, kpiYield, kpiOpenAlerts } =
    useDashboardData();
  const { currentSiteId, setCurrentSiteId: setHeaderSiteId, isGlobalView } = useSite();
  const { sites } = useData();

  // Données tendance (6 derniers mois) et alertes ouvertes pour le site courant.
  const { trendData, trendLoading } = useDashboardTrend(siteId, period, sites);
  const { alerts } = useData();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Synchroniser le sélecteur du header avec le scope du dashboard.
    if (siteId === 'all' || !siteId) {
      setHeaderSiteId(null);
    } else {
      setHeaderSiteId(siteId);
    }
  }, [siteId, setHeaderSiteId]);

  // Défaut période depuis l'URL si présent.
  useEffect(() => {
    const urlPeriod = searchParams.get('periode');
    if (urlPeriod) setPeriod(urlPeriod);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Quand le sélecteur du header change le site, répercuter sur le scope du dashboard.
  useEffect(() => {
    const siteIdFromHeader = currentSiteId === null ? 'all' : currentSiteId;
    if (siteIdFromHeader !== siteId) {
      setSiteId(siteIdFromHeader);
    }
  }, [currentSiteId, siteId, setSiteId]);

  const isLoading = loading || trendLoading || !mounted;

  const hrefFinance = '/app/finance';
  const hrefCampagnes = '/app/exploitation/campagnes';
  const hrefAlertes = '/app/surveillance?tab=alertes';

  return (
    <div className="space-y-6">
      {/* En-tête de page : titre + contexte + remise à zéro */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Tableau de bord</h1>
          <p className="text-xs text-primary/60">
            Ferme AgroVision · {formatDateRange(period)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-primary border border-default rounded-lg hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            Réinitialiser le contexte
          </button>
        </div>
      </div>

      {/* État de chargement */}
      {isLoading && (
        <div className="rounded-xl border border-default bg-surface p-8 flex flex-col items-center justify-center text-primary/60">
          <span className="h-6 w-24 rounded bg-surface-raised animate-pulse mb-2" />
          <p className="text-sm">Chargement du tableau de bord…</p>
        </div>
      )}

      {/* Erreur globale */}
      {error && !isLoading && (
        <div className="rounded-xl border border-terra/50 bg-terra/10 p-4 text-sm text-terra">
          {error}
        </div>
      )}

      {/* Grille des 4 KPIs héros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardKpiCard
          label="Résultat net"
          value={kpiNetResult.value}
          unit={kpiNetResult.unit}
          status={kpiNetResult.status}
          hint={kpiNetResult.hint}
          href={hrefFinance}
        />
        <DashboardKpiCard
          label="Marge brute"
          value={kpiGrossMargin.value}
          unit={kpiGrossMargin.unit}
          status={kpiGrossMargin.status}
          hint={kpiGrossMargin.hint}
          href={hrefFinance}
        />
        <DashboardKpiCard
          label="Rendement"
          value={kpiYield.value}
          unit={kpiYield.unit}
          status={kpiYield.status}
          hint={kpiYield.hint}
          href={hrefCampagnes}
        />
        <DashboardKpiCard
          label="Alertes ouvertes"
          value={kpiOpenAlerts.value}
          unit={kpiOpenAlerts.unit}
          status={kpiOpenAlerts.status}
          hint={kpiOpenAlerts.hint}
          href={hrefAlertes}
        />
      </div>

      {/* Ligne tendance + actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DashboardTrendChart
            title="Recettes vs dépenses (6 mois)"
            data={trendData}
            height={300}
          />
        </div>
        <div>
          <DashboardActionList
            alerts={alerts}
            onViewAll={() => navigate(hrefAlertes)}
          />
        </div>
      </div>

      {/* Pied : contexte affiché (pas de sélecteur local ici, c'est dans le header) */}
      <div className="border-t border-default/10 pt-4 text-xs text-primary/60">
        Contexte :{' '}
        <span className="font-medium">
          {isGlobalView ? 'Tous les sites' : sites?.find((s) => s.id === siteId)?.name || siteId}
        </span>{' '}
        · Période : {period}{' '}
        · Campagne : {campaignId ? campaignId : 'auto'}
      </div>
    </div>
  );
}

function formatDateRange(period: string): string {
  const [y, m] = period.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  return `${formatDate(startStr)} – ${formatDate(endStr)}`;
}

/**
 * Récupère les données de tendance (6 mois) et les alertes ouvertes pour le
 * site sélectionné. Le scope farm_ids est résolu depuis sites (pas de lecture
 * de farms).
 */
function useDashboardTrend(
  siteId: string | 'all',
  period: string,
  sites: { id: string; farm_id: string | null }[]
) {
  const [trendData, setTrendData] = useState<{ month: string; entrees: number; sorties: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const farmIds = siteId === 'all' || !siteId
      ? (sites || []).map((s) => s.farm_id).filter(Boolean)
      : ((sites || []).find((s) => s.id === siteId)?.farm_id ? [(sites || []).find((s) => s.id === siteId)!.farm_id] : []);

    if (farmIds.length === 0) {
      setTrendData([]);
      return;
    }

    setLoading(true);
    const [y, m] = period.split('-').map(Number);
    const start = new Date(y, m - 5, 1); // 6 mois dont le mois courant
    const periodStart = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;

    supabase
      .from('event_journal')
      .select('event_type, amount, occurred_at')
      .in('farm_id', farmIds)
      .gte('occurred_at', periodStart)
      .order('occurred_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (err || !data) {
          setTrendData([]);
          setLoading(false);
          return;
        }
        const byMonth: Record<string, { entrees: number; sorties: number }> = {};
        for (const e of data as unknown as { event_type: string; amount: number; occurred_at: string }[]) {
          const month = e.occurred_at.slice(0, 7);
          if (!byMonth[month]) byMonth[month] = { entrees: 0, sorties: 0 };
          const amount = Number(e.amount || 0);
          if (e.event_type === 'recette') byMonth[month].entrees += amount;
          else if (e.event_type === 'depense') byMonth[month].sorties += amount;
        }
        setTrendData(Object.entries(byMonth).map(([month, v]) => ({ month, entrees: v.entrees, sorties: v.sorties })));
        setLoading(false);
      });
  }, [siteId, period, sites]);

  return { trendData, trendLoading: loading };
}
