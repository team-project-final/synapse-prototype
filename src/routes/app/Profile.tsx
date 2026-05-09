import { Card } from '@/components/ds';
import { XPProgressBar } from '@/components/feature/XPProgressBar';
import { StreakFlame } from '@/components/feature/StreakFlame';
import { BadgeIcon } from '@/components/feature/BadgeIcon';
import { useGameStore } from '@/stores/use-game';
import { BADGES } from '@/lib/xp';

export default function Profile() {
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const title = useGameStore((s) => s.title);
  const streakCurrent = useGameStore((s) => s.streak.current);
  const badges = useGameStore((s) => s.badges);
  const weeklyStats = useGameStore((s) => s.weeklyStats);
  const earnedCount = Object.values(badges).filter((b) => b.earnedAt).length;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h1 className="display text-3xl">내 프로필</h1>

      <Card elevated>
        <div className="flex items-start gap-6 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center display text-3xl text-[#D97706]">
            {level}
          </div>
          <div className="flex-1 min-w-[240px] space-y-3">
            <div>
              <div className="display text-2xl">개발자 김시냅스</div>
              <div className="text-stone-600">
                🏅 레벨 {level} — {title}
              </div>
            </div>
            <XPProgressBar xp={xp} />
            <StreakFlame days={streakCurrent} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="display text-xl mb-3">
          획득한 배지 ({earnedCount} / {BADGES.length})
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
          {BADGES.map((b) => (
            <BadgeIcon
              key={b.id}
              id={b.id}
              name={b.name}
              earned={Boolean(badges[b.id]?.earnedAt)}
              size="lg"
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="display text-xl mb-3">이번 주 학습 현황</h2>
        <dl className="grid grid-cols-3 gap-4 text-center">
          <div>
            <dt className="text-xs text-stone-500">복습 카드</dt>
            <dd className="display text-2xl tabular-nums">{weeklyStats.reviewed}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">노트</dt>
            <dd className="display text-2xl tabular-nums">{weeklyStats.notesCreated}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">XP 획득</dt>
            <dd className="display text-2xl text-[#D97706] tabular-nums">
              +{weeklyStats.xpGained}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
