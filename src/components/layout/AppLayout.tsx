import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <FloatingActionButton
        onAction={(action) => {
          // À implémenter selon les besoins spécifiques après inspection du contrat
          console.log('Action:', action);
        }}
      />
    </div>
  );
}