import { Outlet } from 'react-router';
import { AppShell } from '@/components/shell/AppShell';
import { DemoModeToast } from '@/components/shared/DemoModeToast';

export default function AppLayout() {
  return (
    <AppShell>
      <DemoModeToast />
      <Outlet />
    </AppShell>
  );
}
