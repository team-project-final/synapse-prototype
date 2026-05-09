import { levelFor, LEVELS } from '@/lib/xp';

export function XPProgressBar({ xp, compact = false }: { xp: number; compact?: boolean }) {
  const { level, title, nextRequired } = levelFor(xp);
  const prevRequired = LEVELS[Math.max(0, level - 1)]?.requiredXp ?? 0;
  const range = (nextRequired ?? xp + 1) - prevRequired;
  const progress = Math.min(1, (xp - prevRequired) / range);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="display text-lg text-stone-900">레벨 {level}</span>
        <span className="text-xs text-stone-500">{title}</span>
      </div>
      <div className={`bg-stone-200 rounded-full ${compact ? 'h-1' : 'h-2'} overflow-hidden`}>
        <div
          style={{
            width: `${progress * 100}%`,
            background: 'linear-gradient(to right, #D97706, #B45309)',
          }}
          className="h-full transition-[width] duration-300 ease-out"
        />
      </div>
      <div className="text-xs text-stone-500 tabular-nums">
        {xp.toLocaleString()} {nextRequired ? `/ ${nextRequired.toLocaleString()}` : ''} XP
      </div>
    </div>
  );
}
