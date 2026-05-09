import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { ulid } from 'ulid';
import { Card, Button, Badge, toast } from '@/components/ds';
import { useNotesStore } from '@/stores/use-notes';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { useGameStore } from '@/stores/use-game';
import { CURATED, generateCardsFromContent, type AICardTemplate } from '@/data/ai-templates';
import { xpForAiCardAccept } from '@/lib/xp';

export default function AIGenerate() {
  const [params] = useSearchParams();
  const noteId = params.get('noteId');
  const note = useNotesStore((s) => (noteId ? s.notes[noteId] : undefined));
  const decksMap = useDecksCardsStore((s) => s.decks);
  const decks = Object.values(decksMap);
  const addCards = useDecksCardsStore((s) => s.addCards);
  const addXp = useGameStore((s) => s.addXp);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<AICardTemplate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deckId, setDeckId] = useState<string>(decks[0]?.id ?? '');

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => {
      const generated = CURATED[note.id] ?? generateCardsFromContent(note.contentMd);
      setCards(generated);
      setSelected(new Set(generated.map((_, i) => i)));
      setLoading(false);
    }, 2200);
    return () => clearTimeout(t);
  }, [note]);

  if (!note) return <div className="p-6">노트를 찾을 수 없습니다.</div>;

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const save = () => {
    const accepted = cards.filter((_, i) => selected.has(i));
    if (accepted.length === 0 || !deckId) return;
    const newCards = accepted.map((c) => ({
      id: ulid(),
      deckId,
      type: c.type,
      front: c.front,
      back: c.back,
      sourceNoteId: note.id,
    }));
    addCards(newCards);
    addXp(accepted.length * xpForAiCardAccept());
    toast({
      message: `${accepted.length}장 추가됨 — +${accepted.length * xpForAiCardAccept()} XP`,
      tone: 'success',
    });
    navigate(`/app/decks`);
  };

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        ← 돌아가기
      </Button>
      <h1 className="display text-3xl">🤖 AI 카드 생성</h1>
      <p className="text-stone-600">
        출처: <span className="font-medium">{note.title}</span>
      </p>

      {loading ? (
        <div className="space-y-3">
          <p className="text-sm text-stone-500 animate-pulse">카드를 만들고 있어요...</p>
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <div className="h-4 bg-stone-200 rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-3 bg-stone-200 rounded w-1/2 animate-pulse" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cards.map((c, i) => (
              <Card key={i} className="cursor-pointer" onClick={() => toggle(i)}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-1"
                    aria-label={`카드 ${i + 1} 선택`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge tone={c.type === 'cloze' ? 'teal' : 'neutral'}>{c.type}</Badge>
                      <span className="text-xs text-stone-500">카드 {i + 1}</span>
                    </div>
                    <div className="font-medium mb-1">Q: {c.front}</div>
                    <div className="text-sm text-stone-600">A: {c.back}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-3 sticky bottom-4 bg-stone-50 p-3 rounded-md border border-stone-200">
            <label className="text-sm">덱:</label>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="rounded-sm border border-stone-300 px-2 py-1"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <Button onClick={save} disabled={selected.size === 0}>
              {selected.size}장 저장
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
