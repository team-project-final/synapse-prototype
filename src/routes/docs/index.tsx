import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { Card } from '@/components/ds';
import { loadManifest, groupManifest, type DocMeta } from '@/lib/docs-manifest';

export default function DocsIndex() {
  const [manifest, setManifest] = useState<DocMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadManifest(import.meta.env.BASE_URL)
      .then(setManifest)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="p-6 text-[#DC2626]">{error}</div>;
  if (!manifest) return <div className="p-6 text-stone-500">불러오는 중…</div>;

  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-6xl mx-auto px-6 py-12 space-y-6">
        <header className="space-y-2">
          <h1 className="display text-4xl">문서</h1>
          <p className="text-stone-600">Synapse 위키</p>
          <p className="text-sm text-stone-500">
            기술 스택은{' '}
            <Link to="/tech" className="text-[#D97706] underline">별도 페이지</Link>에서 봅니다.
          </p>
        </header>
        {groupManifest(manifest).map((g) => (
          <section key={g.group}>
            <h2 className="display text-xl mb-3">{g.group}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {g.docs.map((d) => (
                <Link key={d.slug} to={`/docs/${d.slug}`}>
                  <Card className="hover:shadow-md transition-shadow">{d.title}</Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}
