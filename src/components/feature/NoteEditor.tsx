import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ulid } from 'ulid';
import { Button, Input, Badge, toast } from '@/components/ds';
import { useNotesStore } from '@/stores/use-notes';
import { useGameStore } from '@/stores/use-game';
import { xpForNoteCreate } from '@/lib/xp';
import { WikilinkAutocomplete } from './WikilinkAutocomplete';

interface Props {
  noteId?: string;
}

export function NoteEditor({ noteId }: Props) {
  const navigate = useNavigate();
  const allNotes = useNotesStore((s) => Object.values(s.notes));
  const upsert = useNotesStore((s) => s.upsert);
  const addXp = useGameStore((s) => s.addXp);
  const existing = noteId ? useNotesStore.getState().notes[noteId] : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.contentMd ?? '');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [autocompleteState, setAutocompleteState] = useState<{
    open: boolean;
    query: string;
    pos: number;
  } | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!noteId) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      upsert({ id: noteId, title, contentMd: content, tags });
      toast({ message: '저장됨', tone: 'success', duration: 1200 });
    }, 3000);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [title, content, tags, noteId, upsert]);

  const onContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setContent(v);
    const pos = e.target.selectionStart;
    const before = v.slice(0, pos);
    const m = before.match(/\[\[([^\]]*)$/);
    if (m) {
      setAutocompleteState({
        open: true,
        query: m[1] ?? '',
        pos: pos - (m[1]?.length ?? 0) - 2,
      });
    } else {
      setAutocompleteState(null);
    }
  };

  const insertWikilink = (target: string) => {
    if (!autocompleteState || !taRef.current) return;
    const before = content.slice(0, autocompleteState.pos);
    const after = content.slice(taRef.current.selectionStart);
    setContent(`${before}[[${target}]]${after}`);
    setAutocompleteState(null);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const handleSave = () => {
    const id = noteId ?? ulid();
    upsert({ id, title: title || '제목 없음', contentMd: content, tags });
    if (!noteId) {
      addXp(xpForNoteCreate());
      toast({ message: '+10 XP — 새 노트 작성', tone: 'success' });
    }
    navigate(`/app/notes/${id}`);
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← 돌아가기
        </Button>
        <Button onClick={handleSave}>저장</Button>
      </div>

      <Input
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-2xl"
      />

      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((t) => (
          <Badge key={t} tone="amber">
            #{t}{' '}
            <button
              className="ml-1"
              onClick={() => setTags(tags.filter((x) => x !== t))}
              aria-label={`태그 ${t} 제거`}
            >
              ×
            </button>
          </Badge>
        ))}
        <Input
          placeholder="+ 태그 추가"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          className="w-32"
        />
      </div>

      <div className="relative">
        <textarea
          ref={taRef}
          value={content}
          onChange={onContentChange}
          placeholder={'# 제목\n\n본문…\n\n[[링크]]로 다른 노트와 연결할 수 있습니다.'}
          className="w-full min-h-[400px] rounded-md border border-stone-300 bg-white p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
        />
        {autocompleteState?.open && (
          <div className="absolute top-full left-0 mt-1">
            <WikilinkAutocomplete
              query={autocompleteState.query}
              candidates={allNotes}
              onSelect={insertWikilink}
            />
          </div>
        )}
      </div>
    </div>
  );
}
