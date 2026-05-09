import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { Card, Button } from '@/components/ds';
import { MermaidDiagram } from '@/components/shared/MermaidDiagram';
import { loadDoc } from '@/lib/docs-loader';
import { DOCS } from '@/data/docs-list';

export default function DocsSlug() {
  const { slug } = useParams();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setError(null);
    setContent(null);
    loadDoc(slug)
      .then(setContent)
      .catch((e) => setError(e.message));
  }, [slug]);

  const meta = DOCS.find((d) => d.slug === slug);
  const idx = DOCS.findIndex((d) => d.slug === slug);
  const prev = idx > 0 ? DOCS[idx - 1] : null;
  const next = idx >= 0 && idx < DOCS.length - 1 ? DOCS[idx + 1] : null;

  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/docs" className="text-sm text-stone-500 hover:text-[#D97706]">
          ← 문서 목록
        </Link>
        <h1 className="display text-3xl mt-2 mb-6">{meta?.title ?? slug}</h1>

        {error && (
          <Card>
            <p className="text-[#DC2626]">{error}</p>
            <p className="text-xs text-stone-500 mt-2">
              빌드 시 documents.wiki에서 동기화됩니다 (npm run sync-docs).
            </p>
          </Card>
        )}
        {!content && !error && <p className="text-stone-500">불러오는 중…</p>}
        {content && (
          <div className="prose prose-stone max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: ({ className, children }) => {
                  const lang = /language-(\w+)/.exec(className ?? '')?.[1];
                  if (lang === 'mermaid')
                    return <MermaidDiagram source={String(children).trim()} />;
                  return <code className={className}>{children}</code>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        <nav className="flex justify-between mt-12 pt-6 border-t border-stone-200">
          {prev ? (
            <Link to={`/docs/${prev.slug}`}>
              <Button variant="secondary">← {prev.title}</Button>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/docs/${next.slug}`}>
              <Button variant="secondary">{next.title} →</Button>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </div>
  );
}
