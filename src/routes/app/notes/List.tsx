import { useState } from 'react';
import { Link } from 'react-router';
import { Card, Button, Input, Badge } from '@/components/ds';
import { useNotesStore } from '@/stores/use-notes';

export default function NotesList() {
  const notes = useNotesStore((s) => Object.values(s.notes));
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));
  const filtered = notes
    .filter((n) => (tag ? n.tags.includes(tag) : true))
    .filter((n) =>
      query
        ? n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.contentMd.toLowerCase().includes(query.toLowerCase())
        : true,
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-3xl">노트 ({filtered.length})</h1>
        <Link to="/app/notes/new">
          <Button>+ 새 노트</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <Input placeholder="노트 검색…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTag(null)}
            className={`text-xs px-2 py-1 rounded-full ${!tag ? 'bg-[#D97706] text-white' : 'bg-stone-200 text-stone-700'}`}
          >
            전체
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`text-xs px-2 py-1 rounded-full ${tag === t ? 'bg-[#D97706] text-white' : 'bg-stone-200 text-stone-700'}`}
            >
              #{t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((n) => (
          <Link key={n.id} to={`/app/notes/${n.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="display text-lg mb-1 line-clamp-1">{n.title}</h3>
              <p className="text-sm text-stone-600 line-clamp-2 mb-2">
                {n.contentMd.replace(/[#*[\]]/g, '').slice(0, 100)}
              </p>
              <div className="flex gap-1 flex-wrap">
                {n.tags.map((t) => (
                  <Badge key={t} tone="amber">
                    #{t}
                  </Badge>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
