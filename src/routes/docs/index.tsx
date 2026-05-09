import { Link } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { Card } from '@/components/ds';
import { groupedDocs } from '@/data/docs-list';

export default function DocsIndex() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <header>
          <h1 className="display text-4xl">문서</h1>
          <p className="text-stone-600 mt-2">Synapse 위키 — 18개 문서</p>
        </header>

        {groupedDocs().map((g) => (
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
