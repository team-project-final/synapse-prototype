import { useState, type SyntheticEvent } from 'react';
import { loadDoc } from '@/lib/docs-loader';
import { DocsArticle } from '@/components/docs/DocsArticle';

interface AppendixItem {
  title: string;
  slug: string;
}

export function AppendixDocs({ items }: { items: AppendixItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <AppendixDetail key={item.slug} item={item} />
      ))}
    </div>
  );
}

function AppendixDetail({ item }: { item: AppendixItem }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onToggle = (e: SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || content || error) return;
    loadDoc(item.slug).then(setContent).catch((err: Error) => setError(err.message));
  };

  return (
    <details className="rounded-md border border-stone-200 bg-white" onToggle={onToggle}>
      <summary className="cursor-pointer px-4 py-2 text-sm font-medium">{item.title}</summary>
      <div className="px-4 py-3 border-t border-stone-200">
        {error && <p className="text-[#DC2626] text-sm">{error}</p>}
        {!content && !error && <p className="text-stone-500 text-sm">불러오는 중…</p>}
        {content && <DocsArticle source={content} />}
      </div>
    </details>
  );
}
