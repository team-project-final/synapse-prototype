import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { AppBar } from './AppBar';
import { NotificationDrawer } from './NotificationDrawer';
import { useNotificationsStore } from '@/stores/use-notifications';

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const unread = useNotificationsStore((s) => s.unreadCount());

  return (
    <div className="min-h-dvh flex flex-col bg-stone-50">
      <AppBar onOpenNotifications={() => setDrawerOpen(true)} unreadCount={unread} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav />
      <NotificationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
