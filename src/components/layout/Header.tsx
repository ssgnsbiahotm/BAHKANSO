import { useState, useMemo } from 'react';
import { Bell, ChevronDown, User, Menu, Wifi, LogOut, Settings } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_LABELS } from '@/lib/constants';
import { timeAgo } from '@/lib/format';

interface HeaderProps {
  onOpenMobile: () => void;
  onNavigate: (page: string) => void;
}

export function Header({ onOpenMobile, onNavigate }: HeaderProps) {
  const { farm, notifications, alerts, siteContent } = useData();
  const { appUser, signOut } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const openAlerts = useMemo(() => alerts.filter(a => a.status === 'ouverte'), [alerts]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 py-3">
      <div className="flex items-center gap-3">
        <button onClick={onOpenMobile} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
          <Menu size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-900 truncate">{farm?.name || (siteContent.branding?.value as Record<string, string>)?.appName || 'Bahkanso'}</h2>
          <p className="text-xs text-slate-400 hidden sm:block">{farm?.location || ''}</p>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-xs text-slate-500">
          <Wifi size={14} className="text-green-600" />
          <span>Synchronisé</span>
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowUser(false); }}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-20 max-h-96 overflow-y-auto">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  <button onClick={() => { onNavigate('alerts'); setShowNotif(false); }} className="text-xs text-green-600 hover:underline">
                    Voir les {openAlerts.length} alertes
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">Aucune notification</p>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.slice(0, 8).map(n => (
                      <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 ${!n.read ? 'bg-green-50/30' : ''}`}>
                        <div className="flex items-start gap-2">
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            n.level === 'error' ? 'bg-red-500' : n.level === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-500 truncate">{n.message}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowUser(!showUser); setShowNotif(false); }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {appUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 leading-tight">{appUser?.name || 'Utilisateur'}</p>
              <p className="text-xs text-slate-400">{ROLE_LABELS[appUser?.role || ''] || ''}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
          {showUser && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUser(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-20">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{appUser?.name}</p>
                  <p className="text-xs text-slate-400">{appUser?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { onNavigate('profile'); setShowUser(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User size={16} /> Mon profil
                  </button>
                  <button
                    onClick={() => { onNavigate('settings'); setShowUser(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings size={16} /> Paramètres
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
