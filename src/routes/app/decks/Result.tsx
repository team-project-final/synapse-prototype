import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { Button, Card } from '@/components/ds';
import { LevelUpModal } from '@/components/feature/LevelUpModal';
import { useReviewsStore } from '@/stores/use-reviews';
import { useGameStore } from '@/stores/use-game';

export default function DeckResult() {
  const [params] = useSearchParams();
  const sessionId = params.get('sessionId');
  const navigate = useNavigate();
  const location = useLocation();
  const session = useReviewsStore((s) => (sessionId ? s.sessions[sessionId] : undefined));
  const game = useGameStore();

  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    const state = location.state as { leveledUp?: boolean } | null;
    if (state?.leveledUp) setShowLevelUp(true);
  }, [location.state]);

  if (!session) return <div className="p-6">세션을 찾을 수 없습니다.</div>;
  const total = session.ratings.length;
  const correct = session.ratings.filter((r) => r.rating >= 3).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalMs = session.ratings.reduce((sum, r) => sum + r.timeMs, 0);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="display text-3xl text-center">세션 완료 🎉</h1>

      <Card elevated>
        <dl className="grid grid-cols-3 gap-4 text-center">
          <div>
            <dt className="text-xs text-stone-500">정확도</dt>
            <dd className="display text-3xl text-[#0D9488] tabular-nums">{accuracy}%</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">소요</dt>
            <dd className="display text-3xl tabular-nums">
              {minutes}:{String(seconds).padStart(2, '0')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">XP 획득</dt>
            <dd className="display text-3xl text-[#D97706] tabular-nums">+{total * 5}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-2">현재 상태</h3>
        <p>
          레벨 {game.level} · {game.title} · 총 {game.xp.toLocaleString()} XP
        </p>
        <p className="text-xs text-stone-500 mt-1">🔥 {game.streak.current}일 연속 학습</p>
      </Card>

      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={() => navigate('/app/decks')}>
          덱 목록
        </Button>
        <Button onClick={() => navigate('/app')}>대시보드</Button>
      </div>

      <LevelUpModal
        open={showLevelUp}
        newLevel={game.level}
        newTitle={game.title}
        onClose={() => setShowLevelUp(false)}
      />
    </div>
  );
}
