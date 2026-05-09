import { NavLink } from 'react-router';

const tabs = [
  { to: '/app', label: '홈', icon: '🏠' },
  { to: '/app/notes', label: '노트', icon: '📝' },
  { to: '/app/decks', label: '복습', icon: '🃏' },
  { to: '/app/profile', label: '더보기', icon: '⋯' },
];

export function BottomNav() {
  return (
    <nav
      aria-label="모바일 메뉴"
      className="md:hidden fixed bottom-0 inset-x-0 border-t border-stone-200 bg-stone-50/90 backdrop-blur grid grid-cols-4 pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === '/app'}
          className={({ isActive }) =>
            [
              'flex flex-col items-center justify-center py-2 text-xs',
              isActive ? 'text-[#D97706]' : 'text-stone-600',
            ].join(' ')
          }
        >
          <span aria-hidden="true" className="text-lg">
            {t.icon}
          </span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
