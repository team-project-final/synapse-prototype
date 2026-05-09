import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, Button } from '@/components/ds';
import { GraphCanvas } from '@/components/feature/GraphCanvas';
import { useNotesStore } from '@/stores/use-notes';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { buildGraph } from '@/lib/graph';

export default function Graph() {
  const navigate = useNavigate();
  const notes = useNotesStore((s) => Object.values(s.notes));
  const cards = useDecksCardsStore((s) => Object.values(s.cards));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const graph = useMemo(() => buildGraph(notes), [notes]);
  const cardCountByNote = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cards) if (c.sourceNoteId) map.set(c.sourceNoteId, (map.get(c.sourceNoteId) ?? 0) + 1);
    return map;
  }, [cards]);

  const selectedNote = selectedId ? notes.find((n) => n.id === selectedId) : null;
  const selectedNode = selectedId ? graph.nodes.find((n) => n.id === selectedId) : null;

  return (
    <div className="p-6 max-w-6xl space-y-4">
      <h1 className="display text-3xl">그래프 뷰</h1>
      <p className="text-stone-600 text-sm">노드 클릭으로 정보 보기 · 드래그로 이동 · 휠로 줌</p>

      <Card>
        <GraphCanvas graph={graph} onNodeClick={setSelectedId} />
      </Card>

      {selectedNote && selectedNode && (
        <Card elevated>
          <h3 className="display text-xl mb-2">{selectedNote.title}</h3>
          <ul className="text-sm space-y-1 mb-3">
            <li>├─ 연결: {selectedNode.degree}개</li>
            <li>├─ 카드: {cardCountByNote.get(selectedNode.id) ?? 0}장</li>
            <li>└─ 태그: {selectedNote.tags.map((t) => `#${t}`).join(' ') || '없음'}</li>
          </ul>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/app/notes/${selectedNote.id}`)}>노트 열기</Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/ai/generate?noteId=${selectedNote.id}`)}
            >
              AI 카드 생성
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
