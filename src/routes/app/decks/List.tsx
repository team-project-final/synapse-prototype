import { Link } from 'react-router';
import { Card, Button, Badge } from '@/components/ds';
import { useDecksCardsStore } from '@/stores/use-decks-cards';

export default function DecksList() {
  const decksMap = useDecksCardsStore((s) => s.decks);
  const cardsMap = useDecksCardsStore((s) => s.cards);
  const decks = Object.values(decksMap);
  const cards = Object.values(cardsMap);
  const now = Date.now();

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="display text-3xl">덱</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((d) => {
          const deckCards = cards.filter((c) => c.deckId === d.id);
          const due = deckCards.filter((c) => c.srs.due <= now).length;
          const total = deckCards.length;
          const reviewed = deckCards.filter((c) => c.status === 'review').length;
          const progress = total > 0 ? reviewed / total : 0;

          return (
            <Card key={d.id} elevated className="space-y-3">
              <div>
                <h3 className="display text-xl mb-1">{d.name}</h3>
                <p className="text-sm text-stone-600 line-clamp-1">{d.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">진행도</span>
                  <span className="tabular-nums">
                    {reviewed} / {total}
                  </span>
                </div>
                <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0D9488]" style={{ width: `${progress * 100}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  {due > 0 && <Badge tone="amber">오늘 {due}장</Badge>}
                  <span className="text-xs text-stone-500">총 {total}장</span>
                </div>
              </div>

              <Link to={`/app/decks/${d.id}/review`} className="block">
                <Button className="w-full" disabled={due === 0}>
                  {due > 0 ? `▶ 복습 시작 (${due})` : '오늘 복습 완료'}
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
