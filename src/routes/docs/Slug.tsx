import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { DocsShell } from '@/components/docs/DocsShell';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsDrawer } from '@/components/docs/DocsDrawer';
import { DocsArticle } from '@/components/docs/DocsArticle';
import { DocsTOC } from '@/components/docs/DocsTOC';
import { loadManifest, findEntry, type DocMeta } from '@/lib/docs-manifest';
import { loadDoc } from '@/lib/docs-loader';

export default function DocsSlug() {
  const { slug } = useParams();
  const fullSlug = slug!;
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
      {(() => {
        const meta = manifest ? findEntry(manifest, fullSlug) : undefined;
        return (
          <DocsShell
            sidebar={manifest ? <DocsSidebar manifest={manifest} currentSlug={fullSlug} /> : null}
            toc={meta && meta.outline.length > 0 ? <DocsTOC outline={meta.outline} /> : null}
            drawer={
              <DocsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                {manifest && <DocsSidebar manifest={manifest} currentSlug={fullSlug} />}
              </DocsDrawer>
            }
          >
            {meta && meta.outline.length > 0 && (
              <details className="lg:hidden mb-6 rounded-md border border-stone-200 bg-white">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium">On this page</summary>
                <div className="px-3 py-2 border-t border-stone-200">
                  <DocsTOC outline={meta.outline} />
                </div>
              </details>
            )}
            {error && <p className="text-[#DC2626]">{error}</p>}
            {!content && !error && <p className="text-stone-500">불러오는 중…</p>}
            {content && <DocsArticle source={content} />}
          </DocsShell>
        );
      })()}
    </div>
  );
}
