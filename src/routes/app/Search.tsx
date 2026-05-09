import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Card, Input, Badge } from '@/components/ds';
import { useNotesStore } from '@/stores/use-notes';
import { hybridSearch } from '@/lib/search';

const QA_TEMPLATES: Record<string, string> = {
  정규화:
    'L1과 L2 정규화는 모두 [[과적합]] 방지 기법입니다. L1(Lasso)은 sparse 솔루션을, L2(Ridge)는 가중치 감소를 유도합니다.',
  과적합:
    '과적합은 학습 데이터에는 잘 맞지만 새 데이터에 일반화하지 못하는 현상입니다. 정규화, 교차검증, 더 많은 데이터로 해결할 수 있습니다.',
  드롭아웃: '드롭아웃은 학습 시 뉴런을 무작위로 비활성화하는 정규화 기법입니다.',
};

export default function Search() {
  const notes = useNotesStore((s) => Object.values(s.notes));
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'search' | 'qa'>('search');
  const [streaming, setStreaming] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const ids = hybridSearch(query, notes);
    return ids.map((id) => notes.find((n) => n.id === id)).filter(Boolean) as typeof notes;
  }, [query, notes]);

  const askQA = () => {
    setStreaming('');
    const matchKey = Object.keys(QA_TEMPLATES).find((k) => query.includes(k));
    const answer = matchKey
      ? QA_TEMPLATES[matchKey]!
      : `"${query}"에 대한 답변: 관련 노트를 검색하면 더 자세히 볼 수 있습니다.`;
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      setStreaming(answer.slice(0, i));
      if (i >= answer.length) clearInterval(interval);
    }, 30);
  };

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <h1 className="display text-3xl">통합 검색</h1>

      <div className="flex gap-2 border-b border-stone-200">
        <button
          onClick={() => setTab('search')}
          className={`px-4 py-2 ${tab === 'search' ? 'border-b-2 border-[#D97706] text-[#D97706]' : 'text-stone-600'}`}
        >
          🔍 검색
        </button>
        <button
          onClick={() => setTab('qa')}
          className={`px-4 py-2 ${tab === 'qa' ? 'border-b-2 border-[#D97706] text-[#D97706]' : 'text-stone-600'}`}
        >
          🤖 AI Q&amp;A
        </button>
      </div>

      <Input
        autoFocus
        placeholder={tab === 'search' ? '시맨틱 + 키워드 하이브리드 검색…' : '무엇이든 물어보세요…'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && tab === 'qa') askQA();
        }}
      />

      {tab === 'search' ? (
        <>
          {query && (
            <p className="text-xs text-stone-500">
              하이브리드 (시맨틱 + BM25 + RRF) — 결과 {results.length}건
            </p>
          )}
          <div className="space-y-2">
            {results.map((n) => (
              <Link key={n.id} to={`/app/notes/${n.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <h3 className="display text-lg mb-1">{n.title}</h3>
                  <p className="text-sm text-stone-600 line-clamp-2">
                    {n.contentMd.replace(/[#*[\]]/g, '').slice(0, 150)}
                  </p>
                  <div className="flex gap-1 mt-2">
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
        </>
      ) : (
        <Card>
          <p className="text-xs text-stone-500 mb-2">
            🤖 RAG 시뮬레이션 — 관련 노트를 찾아 답변 생성
          </p>
          <div className="min-h-[100px] whitespace-pre-line">
            {streaming || (
              <span className="text-stone-400">질문을 입력하고 Enter를 누르세요</span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
