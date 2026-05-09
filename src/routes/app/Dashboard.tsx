import { Link } from 'react-router';
import { Card, Button } from '@/components/ds';
import { StreakFlame } from '@/components/feature/StreakFlame';
import { XPProgressBar } from '@/components/feature/XPProgressBar';
import { useNotesStore } from '@/stores/use-notes';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { useGameStore } from '@/stores/use-game';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function Dashboard() {
  const notes = useNotesStore((s) => Object.values(s.notes));
  const cards = useDecksCardsStore((s) => Object.values(s.cards));
  const game = useGameStore();
  const recentNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const now = Date.now();
  const dueCount = cards.filter((c) => c.srs.due <= now).length;
  const newCount = cards.filter((c) => c.status === 'new' && c.srs.due <= now).length;
  const learningCount = cards.filter((c) => c.status === 'learning' && c.srs.due <= now).length;
  const reviewCount = Math.max(0, dueCount - newCount - learningCount);

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <h1 className="display text-3xl text-stone-900">대시보드</h1>

      <Card elevated>
        <h2 className="display text-2xl mb-3">📚 오늘의 복습</h2>
        <p className="text-stone-600 mb-4">
          복습할 카드: <span className="display text-3xl text-[#D97706] mx-1">{dueCount}</span>장
        </p>
        <ul className="text-sm text-stone-700 space-y-1 mb-4">
          <li>├─ 복습 대기: {reviewCount}장</li>
          <li>├─ 학습 중: {learningCount}장</li>
          <li>└─ 새 카드: {newCount}장</li>
        </ul>
        <Link to="/app/decks">
          <Button>▶ 복습 시작하기</Button>
        </Link>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-stone-600 mb-3">학습 통계</h3>
          <XPProgressBar xp={game.xp} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-stone-500">이번 주 복습</div>
              <div className="display text-xl">{game.weeklyStats.reviewed}</div>
            </div>
            <div>
              <div className="text-stone-500">노트</div>
              <div className="display text-xl">{game.weeklyStats.notesCreated}</div>
            </div>
            <div>
              <div className="text-stone-500">XP</div>
              <div className="display text-xl">+{game.weeklyStats.xpGained}</div>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-stone-600 mb-3">연속 학습</h3>
          <StreakFlame days={game.streak.current} />
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-medium text-stone-600 mb-3">최근 노트</h3>
        <ul className="divide-y divide-stone-200">
          {recentNotes.map((n) => (
            <li key={n.id} className="py-2">
              <Link
                to={`/app/notes/${n.id}`}
                className="flex justify-between hover:text-[#D97706]"
              >
                <span>• {n.title}</span>
                <span className="text-xs text-stone-500">
                  {formatDistanceToNow(n.updatedAt, { locale: ko, addSuffix: true })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Link to="/app/notes/new">
            <Button variant="secondary">+ 새 노트 작성</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
