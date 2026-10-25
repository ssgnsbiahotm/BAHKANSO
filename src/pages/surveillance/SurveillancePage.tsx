import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/Toast';
import { formatDate, formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { RotatingCard } from '@/components/ui/RotatingCard';
import { AlertesTab } from '@/pages/surveillance/tabs/AlertesTab';
import { EvenementsTab } from '@/pages/surveillance/tabs/EvenementsTab';
import { HistoriqueTab } from '@/pages/surveillance/tabs/HistoriqueTab';
import { Plus, AlertCircle } from 'lucide-react';

export function SurveillancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Récupérer l'onglet actif depuis l'URL (?tab=)
  const activeTab = (() => {
    const tab = searchParams.get('tab') || 'alertes';
    if (tab === 'alertes') return 'AlertesTab';
    if (tab === 'evenements') return 'EvenementsTab';
    if (tab === 'historique') return 'HistoriqueTab';
    return 'EvenementsTab'; // par défaut
  })();

  const { refresh } = useData();
  const { appUser } = useAuth();
  const toast = useToast();

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Surveillance"
        subtitle="Centre de gestion des événements et alertes agricoles"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/app/surveillance?tab=evenements', { replace: true })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
              title="Voir les événements"
            >
              <Plus size={16} /> Événements
            </button>
            <button
              onClick={() => navigate('/app/surveillance?tab=alertes', { replace: true })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
              title="Voir les alertes"
            >
              <AlertCircle size={16} /> Alertes
            </button>
          </div>
        }
      />

      {/* Sous-page conditionnelle selon l'onglet actif */}
      {activeTab === 'AlertesTab' && <AlertesTab />}
      {activeTab === 'EvenementsTab' && <EvenementsTab />}
      {activeTab === 'HistoriqueTab' && <HistoriqueTab />}
      {activeTab === 'EvenementsTab' && <EvenementsTab />}

    </div>
  );
}