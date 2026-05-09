import { useState } from 'react';
import { Button } from '@/components/ds';
import { useNotificationsStore, type NotificationCategory } from '@/stores/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: Array<{ id: NotificationCategory | 'all'; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'review', label: '복습' },
  { id: 'community', label: '커뮤니티' },
  { id: 'achievement', label: '성취' },
];

export function NotificationDrawer({ open, onClose }: Props) {
  const items = useNotificationsStore((s) => s.items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-stone-900/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-40 h-dvh w-full sm:w-96 bg-stone-50 shadow-xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
        aria-label="알림 센터"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
          <h2 className="display text-lg">알림</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={markAllRead}>
              모두 읽음
            </Button>
            <button onClick={onClose} aria-label="닫기" className="p-1">
              ×
            </button>
          </div>
        </header>

        <nav className="flex gap-1 px-4 py-2 border-b border-stone-200 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${filter === c.id ? 'bg-[#D97706] text-white' : 'bg-stone-200 text-stone-700'}`}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <div className="overflow-auto flex-1 p-3 space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-stone-500 py-8">알림이 없습니다</p>
          )}
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => markRead(item.id)}
              className={`w-full text-left rounded-md p-3 border ${item.read ? 'bg-stone-50 border-stone-200' : 'bg-[#FEF3C7]/40 border-[#FEF3C7]'}`}
            >
              <div className="flex items-start gap-2">
                <span aria-hidden="true">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-stone-600">{item.body}</div>
                  <div className="text-[10px] text-stone-500 mt-1">
                    {formatDistanceToNow(item.createdAt, { locale: ko, addSuffix: true })}
                  </div>
                </div>
                {!item.read && (
                  <span
                    className="w-2 h-2 rounded-full bg-[#D97706] mt-1"
                    aria-label="읽지 않음"
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
