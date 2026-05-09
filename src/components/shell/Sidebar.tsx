import { NavLink } from 'react-router';

const items = [
  { to: '/app', label: '대시보드', icon: '🏠' },
  { to: '/app/notes', label: '노트', icon: '📝' },
  { to: '/app/decks', label: '덱', icon: '🃏' },
  { to: '/app/graph', label: '그래프', icon: '🕸️' },
  { to: '/app/search', label: '검색', icon: '🔍' },
  { to: '/app/groups', label: '커뮤니티', icon: '👥' },
  { to: '/app/profile', label: '프로필', icon: '🏅' },
];

export function Sidebar() {
  return (
    <nav
      aria-label="주 메뉴"
      className="hidden md:flex w-60 flex-col border-r border-stone-200 bg-stone-50 py-4"
    >
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === '/app'}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100',
              isActive ? 'bg-[#FEF3C7] text-[#B45309] font-medium' : '',
            ].join(' ')
          }
        >
          <span aria-hidden="true">{it.icon}</span>
          <span>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
