import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, User, Menu, Wifi, LogOut, Settings, ExternalLink } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { useSite } from '@/lib/SiteContext';
import { ROLE_LABELS } from '@/lib/constants';
import { timeAgo } from '@/lib/format';
import { SiteSelector } from '@/components/ui/SiteSelector';

interface HeaderProps {
  onOpenMobile: () => void;
}

export function Header({ onOpenMobile }: HeaderProps) {
  const { farm, notifications, alerts, siteContent } = useData();
  const { appUser, signOut } = useAuth();
  const { isGlobalView } = useSite();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const openAlerts = useMemo(() => alerts.filter(a => a.status === 'ouverte'), [alerts]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-20 bg-slate border-b border-ivory/10 px-4 lg:px-6 py-3">
      <div className="flex items-center gap-3">
        <button onClick={onOpenMobile} className="lg:hidden p-2 hover:bg-slate-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-signal" aria-label="Ouvrir le menu">
          <Menu size={20} className="text-ivory/70" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-ivory truncate">{farm?.name || (siteContent.branding?.value as Record<string, string>)?.appName || 'Bahkanso'}</h2>
          <p className="text-xs text-ivory/60 hidden sm:block">{farm?.location || ''}</p>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-signal-soft text-xs text-signal">
          <Wifi size={14} className="text-signal" />
          <span>Synchronisé</span>
        </div>

        <div className="hidden md:block ml-2">
          <SiteSelector />
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowUser(false); }}
            className="relative p-2 hover:bg-slate-hover text-ivory/70 hover:text-ivory"
            aria-label="Afficher les notifications"
            aria-expanded={showNotif}
            aria-haspopup="true"
          >
            <Bell size={20} className="text-ivory/70" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-terra text-slate text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-deep border border-ivory/10 z-20 max-h-96 overflow-y-auto">
                <div className="px-4 py-3 border-b border-ivory/10 flex items-center justify-between">
                  <h3 className="font-semibold text-ivory">Notifications</h3>
                  <button onClick={() => { navigate('/app/monitoring?alertes'); setShowNotif(false); }} className="text-xs text-signal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-signal">
                    Voir les {openAlerts.length} alertes
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-ivory/70">Aucune notification</p>
                ) : (
                  <div className="divide-y divide-ivory/10">
                    {notifications.slice(0, 8).map(n => (
                      <div key={n.id} className={`px-4 py-3 hover:bg-slate-hover ${!n.read ? 'bg-signal-soft' : ''}`}>
                        <div className="flex items-start gap-2">
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            n.level === 'error' ? 'bg-terra' : n.level === 'warning' ? 'bg-terra' : 'bg-signal'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ivory">{n.title}</p>
                            <p className="text-xs text-ivory/70 truncate">{n.message}</p>
                            <p className="text-xs text-ivory/70 mt-0.5">{timeAgo(n.created_at)}</p>
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
            className="flex items-center gap-2 p-1.5 hover:bg-slate-hover"
            aria-label="Ouvrir le menu utilisateur"
            aria-expanded={showUser}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 bg-signal text-ivory flex items-center justify-center text-sm font-semibold">
              {appUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-ivory leading-tight">{appUser?.name || 'Utilisateur'}</p>
              <p className="text-xs text-ivory/70">{ROLE_LABELS[appUser?.role || ''] || ''}</p>
            </div>
            <ChevronDown size={16} className="text-ivory/70" />
          </button>
          {showUser && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUser(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-deep border border-ivory/10 z-20">
                <div className="px-4 py-3 border-b border-ivory/10">
                  <p className="text-sm font-medium text-ivory">{appUser?.name}</p>
                  <p className="text-xs text-ivory/70">{appUser?.email}</p>
                </div>
                {isGlobalView && (
                  <div className="px-4 py-3 border-b border-ivory/10">
                    <label className="block text-xs text-ivory/60 mb-1">Site actif</label>
                  </div>
                )}
                <div className="py-1">
                  <button
                    onClick={() => { navigate('/app/profile'); setShowUser(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ivory hover:bg-slate-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                  >
                    <User size={16} /> Mon profil
                  </button>
                  <button
                    onClick={() => { navigate('/app/configuration'); setShowUser(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ivory hover:bg-slate-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                  >
                    <Settings size={16} /> Paramètres
                  </button>
                  <button
                    onClick={() => { navigate('/'); setShowUser(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-ivory hover:bg-slate-hover flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                  >
                    <ExternalLink size={16} />
                    Voir le site vitrine
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-terra hover:bg-terra/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
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
