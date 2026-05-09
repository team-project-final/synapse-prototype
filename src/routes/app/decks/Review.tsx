import { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ulid } from 'ulid';
import { Button } from '@/components/ds';
import { FlashCard } from '@/components/feature/FlashCard';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { useReviewsStore } from '@/stores/use-reviews';
import { useGameStore } from '@/stores/use-game';
import { applyRating, type Rating } from '@/lib/sm2';
import { xpForReview } from '@/lib/xp';

export default function DeckReview() {
  const { id: deckId } = useParams();
  const navigate = useNavigate();
  const allCards = useDecksCardsStore((s) => s.cards);
  const updateCardSrs = useDecksCardsStore((s) => s.updateCardSrs);
  const startSession = useReviewsStore((s) => s.startSession);
  const recordRating = useReviewsStore((s) => s.recordRating);
  const advance = useReviewsStore((s) => s.advance);
  const completeSession = useReviewsStore((s) => s.completeSession);
  const addXp = useGameStore((s) => s.addXp);
  const registerActivity = useGameStore((s) => s.registerActivity);

  const cards = useMemo(
    () =>
      Object.values(allCards).filter((c) => c.deckId === deckId && c.srs.due <= Date.now()),
    [allCards, deckId],
  );

  const [sessionId] = useState(() => ulid());
  const [index, setIndex] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (cards.length === 0 || initialized) return;
    startSession({ id: sessionId, deckId: deckId!, cardIds: cards.map((c) => c.id) });
    setInitialized(true);
  }, [cards, initialized, sessionId, deckId, startSession]);

  const handleRate = useCallback(
    (rating: Rating) => {
      if (index >= cards.length) return;
      const current = cards[index]!;
      const elapsed = Date.now() - startTime;
      const nextSrs = applyRating(current.srs, rating);
      const newStatus =
        rating === 1 ? 'learning' : nextSrs.repetitions >= 2 ? 'review' : 'learning';
      updateCardSrs(current.id, nextSrs, newStatus);
      recordRating(sessionId, current.id, rating, elapsed);
      const xpResult = addXp(xpForReview());

      if (index + 1 >= cards.length) {
        completeSession(sessionId);
        registerActivity(new Date().toISOString().slice(0, 10));
        navigate(`/app/decks/${deckId}/review/result?sessionId=${sessionId}`, {
          state: { leveledUp: xpResult.leveledUp, newLevel: xpResult.newLevel },
        });
      } else {
        advance(sessionId);
        setIndex(index + 1);
        setStartTime(Date.now());
      }
    },
    [
      index,
      cards,
      startTime,
      sessionId,
      deckId,
      updateCardSrs,
      recordRating,
      addXp,
      completeSession,
      registerActivity,
      advance,
      navigate,
    ],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) handleRate(Number(e.key) as Rating);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRate]);

  if (cards.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h1 className="display text-2xl mb-2">오늘 복습할 카드가 없습니다 🎉</h1>
        <Button variant="secondary" onClick={() => navigate('/app/decks')}>
          덱 목록으로
        </Button>
      </div>
    );
  }

  if (index >= cards.length) return null;
  const current = cards[index]!;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-8">
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm('세션을 종료할까요?')) navigate('/app/decks');
          }}
        >
          × 종료
        </Button>
        <span className="text-sm text-stone-600 tabular-nums">
          {index + 1} / {cards.length}
        </span>
      </div>

      <FlashCard key={current.id} front={current.front} back={current.back} onRate={handleRate} />

      {current.sourceNoteId && (
        <div className="text-center mt-6">
          <button
            onClick={() => navigate(`/app/notes/${current.sourceNoteId}`)}
            className="text-sm text-stone-500 hover:text-[#D97706]"
          >
            출처: 노트 보기 📄
          </button>
        </div>
      )}
    </div>
  );
}
