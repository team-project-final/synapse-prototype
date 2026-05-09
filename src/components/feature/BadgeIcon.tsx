interface Props {
  id: string;
  name: string;
  earned: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ICONS: Record<string, string> = {
  'first-note': '🌱',
  'first-review': '📖',
  'streak-7': '🔥',
  'streak-30': '⚡',
  'reviews-100': '🏆',
  'notes-50': '📚',
  'level-5': '🌟',
  'level-10': '💡',
};

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-3xl',
};

export function BadgeIcon({ id, name, earned, size = 'md' }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClass[size]} flex items-center justify-center rounded-md ${earned ? 'bg-stone-100' : 'bg-stone-50 opacity-40 grayscale'}`}
        title={name}
      >
        <span aria-hidden="true">{ICONS[id] ?? '⭐'}</span>
      </div>
      <span className="text-xs text-stone-600 text-center">{name}</span>
    </div>
  );
}
