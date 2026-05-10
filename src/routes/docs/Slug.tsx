import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { DocsShell } from '@/components/docs/DocsShell';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsDrawer } from '@/components/docs/DocsDrawer';
import { loadManifest, findEntry, type DocMeta } from '@/lib/docs-manifest';
import { loadDoc } from '@/lib/docs-loader';

export default function DocsSlug() {
  const { slug, sub } = useParams();
  const fullSlug = sub ? `${slug}/${sub}` : slug!;
  const [manifest, setManifest] = useState<DocMeta[] | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadManifest(import.meta.env.BASE_URL).then(setManifest).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    setContent(null);
    setError(null);
    loadDoc(fullSlug).then(setContent).catch((e: Error) => setError(e.message));
  }, [fullSlug]);

  const meta = manifest ? findEntry(manifest, fullSlug) : undefined;

  return (
    <div>
      <SiteHeader />
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-20 rounded-md bg-stone-50/90 backdrop-blur px-3 py-1 text-sm shadow-sm"
        aria-label="목록 열기"
      >
        ☰ 목록
      </button>
      <DocsShell
        sidebar={manifest ? <DocsSidebar manifest={manifest} currentSlug={fullSlug} /> : null}
        toc={null}
        drawer={
          <DocsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            {manifest && <DocsSidebar manifest={manifest} currentSlug={fullSlug} />}
          </DocsDrawer>
        }
      >
        <h1 className="display text-3xl mb-6">{meta?.title ?? fullSlug}</h1>
        {error && <p className="text-[#DC2626]">{error}</p>}
        {!content && !error && <p className="text-stone-500">불러오는 중…</p>}
        {content && (
          <pre className="text-xs whitespace-pre-wrap">{content.slice(0, 800)}…</pre>
        )}
      </DocsShell>
    </div>
  );
}
