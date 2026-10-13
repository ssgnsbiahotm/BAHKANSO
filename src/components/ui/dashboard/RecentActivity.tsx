import React from 'react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/format';

interface RecentActivityProps {
  onNavigate: (page: string) => void;
}

export function RecentActivity({ onNavigate }: RecentActivityProps) {
  const { auditLogs } = useData();
  const { appUser } = useAuth();

  const recentActivity = auditLogs.slice(0, 8).map(log => ({
    ...log,
    timeStr: formatDate(log.created_at), // Simplified, in real app would use timeAgo
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Activité récente</h3>
        <button onClick={() => onNavigate('audit')} className="text-xs text-green-600 hover:underline flex items-center gap-1">
          Voir tout <ArrowRight size={12} />
        </button>
      </div>
      <div className="space-y-3">
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Aucune activité</p>
        ) : (
          recentActivity.map(log => (
            <div key={log.id} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock size={14} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900">
                  <span className="font-medium">{log.user_name}</span> — {log.description}
                </p>
                <p className="text-xs text-slate-400">{log.timeStr}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}