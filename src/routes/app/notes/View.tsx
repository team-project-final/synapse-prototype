import { useParams, Link, useNavigate } from 'react-router';
import { Card, Button, Badge } from '@/components/ds';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { useNotesStore } from '@/stores/use-notes';

export default function NoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const note = useNotesStore((s) => (id ? s.notes[id] : undefined));
  const backlinks = useNotesStore((s) => (note ? s.backlinksOf(note.title) : []));
  const allNotes = useNotesStore((s) => s.notes);

  if (!note) return <div className="p-6">노트를 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← 돌아가기
        </Button>
        <div className="flex gap-2">
          <Link to={`/app/notes/${note.id}/edit`}>
            <Button variant="secondary">편집</Button>
          </Link>
          <Link to={`/app/ai/generate?noteId=${note.id}`}>
            <Button>🤖 AI 카드 생성</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <article className="space-y-3">
          <h1 className="display text-4xl text-stone-900">{note.title}</h1>
          <div className="flex gap-2 flex-wrap">
            {note.tags.map((t) => (
              <Badge key={t} tone="amber">
                #{t}
              </Badge>
            ))}
          </div>
          <Card>
            <MarkdownRenderer source={note.contentMd} />
          </Card>
        </article>

        <aside className="space-y-3">
          <Card>
            <h3 className="text-sm font-medium mb-2">◀ 이 노트를 참조 ({backlinks.length})</h3>
            {backlinks.length === 0 && <p className="text-xs text-stone-500">없음</p>}
            <ul className="space-y-1">
              {backlinks.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/app/notes/${b.id}`}
                    className="text-sm text-stone-700 hover:text-[#D97706]"
                  >
                    📄 {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="text-sm font-medium mb-2">▶ 이 노트가 참조 ({note.outgoingLinks.length})</h3>
            <ul className="space-y-1">
              {note.outgoingLinks.map((title) => {
                const target = Object.values(allNotes).find((n) => n.title === title);
                return (
                  <li key={title}>
                    {target ? (
                      <Link
                        to={`/app/notes/${target.id}`}
                        className="text-sm text-stone-700 hover:text-[#D97706]"
                      >
                        📄 {title}
                      </Link>
                    ) : (
                      <span className="text-sm text-stone-400">📄 {title} (미생성)</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
