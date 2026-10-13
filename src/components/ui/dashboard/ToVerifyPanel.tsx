import React from 'react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

interface ToVerifyPanelProps {
  onNavigate: (page: string) => void;
}

export function ToVerifyPanel({ onNavigate }: ToVerifyPanelProps) {
  const { expenses, inventoryItems, projects } = useData();
  const { appUser } = useAuth();
  const canAccessExpenses = hasPermission(appUser?.role, 'expenses', 'read');
  const canAccessInventory = hasPermission(appUser?.role, 'inventory', 'read');
  const canAccessProjects = hasPermission(appUser?.role, 'projects', 'read');

  const toVerify = [];

  // Expenses without justification
  if (canAccessExpenses) {
    expenses.filter(e => !e.has_justificatif && e.status !== 'annulée' && e.status !== 'rejetée').forEach(e => {
      toVerify.push({
        type: 'Dépense sans justificatif',
        desc: `${e.reference} — ${e.description || ''}`,
        amount: formatCurrency(e.amount),
        page: 'expenses'
      });
    });

    // Expenses pending validation
    expenses.filter(e => e.status === 'en attente').forEach(e => {
      toVerify.push({
        type: 'Validation en attente',
        desc: `${e.reference} — ${e.description || ''}`,
        amount: formatCurrency(e.amount),
        page: 'expenses?pending'
      });
    });
  }

  // Low stock items
  if (canAccessInventory) {
    inventoryItems.filter(i => i.current_stock < i.min_stock).forEach(i => {
      toVerify.push({
        type: 'Stock faible',
        desc: `${i.name} — ${i.current_stock} ${i.unit} (min: ${i.min_stock})`,
        amount: '',
        page: 'inventory'
      });
    });
  }

  // Delayed projects
  if (canAccessProjects) {
    // Assuming we have a way to detect delayed projects
    // For now, let's use a simple approach - projects with status 'en retard' if it exists
    // Or we could calculate based on expected end date vs current date
    projects.filter(p => p.status === 'en retard').forEach(p => {
      toVerify.push({
        type: 'Projet en retard',
        desc: p.name,
        amount: '',
        page: 'projects'
      });
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">À vérifier</h3>
        <button onClick={() => onNavigate('alerts')} className="text-xs text-green-600 hover:underline flex items-center gap-1">
          Voir tout <ArrowRight size={12} />
        </button>
      </div>
      <div className="space-y-2">
        {toVerify.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Rien à vérifier</p>
        ) : (
          toVerify.slice(0, 6).map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => onNavigate(item.page)}>
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{item.type}</p>
                <p className="text-xs text-slate-500 truncate">{item.desc}</p>
              </div>
              {item.amount && <span className="text-sm font-medium text-slate-700">{item.amount}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}