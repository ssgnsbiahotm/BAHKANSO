import React from 'react';
import { RotatingCard } from '@/components/ui/Charts';
import { Wallet, Landmark, Sprout, Beef, HardHat, Package, Truck, FileBarChart, Bell, ScrollText, Users, Settings, ChevronDown, TrendingUp, HardHat as HardHatIcon, PiggyBank } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { formatCurrency } from '@/lib/format';
import { matchesPeriod } from '@/lib/business';

interface MetricCardsProps {
  period: '2026' | '2025' | 'all';
}

export function MetricCards({ period }: MetricCardsProps) {
  const { farm, expenses, fundings, bankAccounts, cashAccounts, projects, documents, alerts, auditLogs, inventoryItems, campaigns, transactions, cropOperations, harvests, animals, animalLots, animalEvents, projects: allProjects, projectSteps, inventoryItems: allInventoryItems, inventoryMovements, inventoryCounts, budgets, notifications, siteContent } = useData();

  const filterByPeriod = (dateStr: string | null | undefined) => matchesPeriod(dateStr, period);

  const kpis = {
    treasury: bankAccounts.reduce((s, a) => s + a.balance, 0) + cashAccounts.reduce((s, a) => s + a.balance, 0),
    totalFunded: fundings.filter(f => f.status === 'reçu' && filterByPeriod(f.date_sent)).reduce((s, f) => s + (f.amount_received || 0), 0),
    totalSpent: expenses.filter(e => e.status === 'validée' && filterByPeriod(e.date)).reduce((s, e) => s + e.amount, 0),
    budgetRemaining:
      fundings.filter(f => f.status === 'reçu' && filterByPeriod(f.date_sent)).reduce((s, f) => s + (f.amount_received || 0), 0) -
      expenses.filter(e => e.status === 'validée' && filterByPeriod(e.date)).reduce((s, e) => s + e.amount, 0),
    ongoingProjects: projects.filter(p => p.status === 'en cours').length,
    docsToVerify: documents.filter(d => d.status === 'à vérifier').length,
    openAlerts: alerts.filter(a => a.status === 'ouverte').length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <RotatingCard
        className="h-full"
        front={
          <div className="flex h-full flex-col bg-gradient-to-br from-green-50 via-white to-emerald-100 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-green-600/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-green-700">Trésorerie</span>
              <Wallet size={18} className="text-green-700" />
            </div>
            <div className="mt-auto">
              <p className="text-xs uppercase tracking-wide text-slate-500">Solde disponible</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(kpis.treasury)}</p>
              <p className="mt-2 text-sm text-slate-600">Caisse + banques de l’exploitation</p>
            </div>
          </div>
        }
        back={
          <div className="flex h-full flex-col bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Synthèse</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between"><span>Financements reçus</span><span className="font-semibold text-white">{formatCurrency(kpis.totalFunded)}</span></div>
              <div className="flex items-center justify-between"><span>Dépenses</span><span className="font-semibold text-white">{formatCurrency(kpis.totalSpent)}</span></div>
              <div className="flex items-center justify-between"><span>État</span><span className="font-semibold text-white">Actif</span></div>
              <div className="flex items-center justify-between"><span>Budget restant</span><span className="font-semibold text-white">{formatCurrency(kpis.budgetRemaining)}</span></div>
            </div>
          </div>
        }
      />

      <RotatingCard
        className="h-full"
        front={
          <div className="flex h-full flex-col bg-gradient-to-br from-blue-50 via-white to-sky-100 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-blue-600/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Agriculture</span>
              <Sprout size={18} className="text-blue-700" />
            </div>
            <div className="mt-auto">
              <p className="text-xs uppercase tracking-wide text-slate-500">Campagnes actives</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{String(campaigns.filter(c => c.status === 'en cours').length)}</p>
              <p className="mt-2 text-sm text-slate-600">Suivi des cultures et récoltes</p>
            </div>
          </div>
        }
        back={
          <div className="flex h-full flex-col bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pilotage</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between"><span>Projets en cours</span><span className="font-semibold text-white">{String(kpis.ongoingProjects)}</span></div>
              <div className="flex items-center justify-between"><span>Documents à vérifier</span><span className="font-semibold text-white">{String(kpis.docsToVerify)}</span></div>
              <div className="flex items-center justify-between"><span>Alertes</span><span className="font-semibold text-amber-300">{String(kpis.openAlerts)}</span></div>
            </div>
          </div>
        }
      />

      <RotatingCard
        className="h-full"
        front={
          <div className="flex h-full flex-col bg-gradient-to-br from-amber-50 via-white to-orange-100 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-amber-600/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">Élevage</span>
              <TrendingUp size={18} className="text-amber-700" />
            </div>
            <div className="mt-auto">
              <p className="text-xs uppercase tracking-wide text-slate-500">Mouvements</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{String(transactions.length)}</p>
              <p className="mt-2 text-sm text-slate-600">Entrées, sorties et suivi financier</p>
            </div>
          </div>
        }
        back={
          <div className="flex h-full flex-col bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Performance</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between"><span>Projets en cours</span><span className="font-semibold text-white">{String(kpis.ongoingProjects)}</span></div>
              <div className="flex items-center justify-between"><span>Documents à vérifier</span><span className="font-semibold text-white">{String(kpis.docsToVerify)}</span></div>
              <div className="flex items-center justify-between"><span>Alertes</span><span className="font-semibold text-amber-300">{String(kpis.openAlerts)}</span></div>
            </div>
          </div>
        }
      />
    </div>
  );
}