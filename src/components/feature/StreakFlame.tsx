export function StreakFlame({ days }: { days: number }) {
  const accent = days >= 7 ? '#B45309' : '#D97706';
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" style={{ color: accent }} className="text-2xl">
        🔥
      </span>
      <div>
        <div style={{ color: '#292524' }} className="display text-xl tabular-nums">
          {days}
        </div>
        <div className="text-xs text-stone-500">일 연속</div>
      </div>
    </div>
  );
}
