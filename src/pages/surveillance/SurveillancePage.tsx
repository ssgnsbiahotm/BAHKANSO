import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertesTab } from '@/pages/surveillance/tabs/AlertesTab';
import { EvenementsTab } from '@/pages/surveillance/tabs/EvenementsTab';
import { HistoriqueTab } from '@/pages/surveillance/tabs/HistoriqueTab';
import { AlertCircle, CalendarDays, History } from 'lucide-react';
import { getSurveillanceTab, type SurveillanceTab } from './surveillanceNavigation';

const TABS: Array<{ id: SurveillanceTab; label: string; icon: typeof AlertCircle }> = [
  { id: 'alertes', label: 'Alertes', icon: AlertCircle },
  { id: 'evenements', label: 'Événements', icon: CalendarDays },
  { id: 'historique', label: 'Historique', icon: History },
];

export function SurveillancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = getSurveillanceTab(`?${searchParams.toString()}`);

  const selectTab = (tab: SurveillanceTab) => {
    navigate(tab === 'alertes' ? '/app/surveillance' : `/app/surveillance?tab=${tab}`);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-primary">Surveillance</h1>
        <p className="text-sm text-muted mt-1">Centre de gestion des alertes, événements et actions agricoles</p>
      </div>

      <nav aria-label="Sections de surveillance" className="mb-6 flex flex-wrap gap-2 border-b border-default pb-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-accent-primary text-white'
                : 'text-muted hover:bg-surface-hover hover:text-primary'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'alertes' && <AlertesTab />}
      {activeTab === 'evenements' && <EvenementsTab />}
      {activeTab === 'historique' && <HistoriqueTab />}
    </div>
  );
}