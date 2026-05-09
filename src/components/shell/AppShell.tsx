import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { AppBar } from './AppBar';

interface AppShellProps {
  children: ReactNode;
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export function AppShell({ children, onOpenNotifications, unreadCount }: AppShellProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-stone-50">
      <AppBar onOpenNotifications={onOpenNotifications} unreadCount={unreadCount} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
