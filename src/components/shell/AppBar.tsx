import { Link } from 'react-router';
import { DemoModeToggle } from '@/components/shared/DemoModeToggle';

interface AppBarProps {
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export function AppBar({ onOpenNotifications, unreadCount }: AppBarProps) {
  return (
    <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/app" className="display text-xl text-stone-900">
          Synapse
        </Link>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="검색…"
            aria-label="검색"
            className="hidden sm:block rounded-sm border border-stone-300 bg-white px-3 py-1 text-sm"
          />
          <button
            aria-label={`알림 ${unreadCount ?? 0}개 미읽음`}
            onClick={onOpenNotifications}
            className="relative rounded-md p-2 hover:bg-stone-100"
          >
            🔔
            {unreadCount && unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 bg-[#D97706] text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center tabular-nums">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>
          <DemoModeToggle />
        </div>
      </div>
    </header>
  );
}
