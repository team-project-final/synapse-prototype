import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { DocsShell } from '@/components/docs/DocsShell';
import { DocsDrawer } from '@/components/docs/DocsDrawer';
import { DocsArticle } from '@/components/docs/DocsArticle';
import { DocsTOC } from '@/components/docs/DocsTOC';
import { TechSidebar } from '@/components/tech/TechSidebar';
import { TechMetaPanel } from '@/components/tech/TechMetaPanel';
import { TechPager } from '@/components/tech/TechPager';
import { findTechBySlug, loadTechManifest, type TechManifest } from '@/lib/tech-manifest';
import { loadDoc } from '@/lib/docs-loader';

export default function TechSlug() {
  const { slug } = useParams();
  const fullSlug = slug!;
  const [manifest, setManifest] = useState<TechManifest | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadTechManifest(import.meta.env.BASE_URL)
      .then(setManifest)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!manifest) return;
    const tech = findTechBySlug(manifest.techs, fullSlug);
    if (!tech) {
      setContent(null);
      return;
    }
    setContent(null);
    loadDoc(`tech/${tech.slug}`).then(setContent).catch((e: Error) => setError(e.message));
  }, [manifest, fullSlug]);

  if (error) {
    return (
      <div>
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-6 py-12 text-[#DC2626]">{error}</div>
      </div>
    );
  }
  if (!manifest) {
    return (
      <div>
        <SiteHeader />
        <p className="max-w-3xl mx-auto px-6 py-12 text-stone-500">불러오는 중…</p>
      </div>
    );
  }

  const tech = findTechBySlug(manifest.techs, fullSlug);
  if (!tech) {
    return (
      <div>
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-3">
          <h1 className="display text-3xl">기술을 찾을 수 없습니다</h1>
          <p>
            <Link to="/tech" className="text-[#D97706] underline">기술 스택 허브로 →</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SiteHeader />
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-20 rounded-md bg-stone-50/90 backdrop-blur px-3 py-1 text-sm shadow-sm"
        aria-label="기술 목록 열기"
      >
        ☰ 목록
      </button>
      <DocsShell
        sidebar={<TechSidebar techs={manifest.techs} currentSlug={fullSlug} />}
        toc={tech.outline.length > 0 ? <DocsTOC outline={tech.outline} /> : null}
        drawer={
          <DocsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <TechSidebar techs={manifest.techs} currentSlug={fullSlug} />
          </DocsDrawer>
        }
      >
        <TechMetaPanel tech={tech} />
        {tech.outline.length > 0 && (
          <details className="lg:hidden mb-6 rounded-md border border-stone-200 bg-white">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">On this page</summary>
            <div className="px-3 py-2 border-t border-stone-200">
              <DocsTOC outline={tech.outline} />
            </div>
          </details>
        )}
        {!content && <p className="text-stone-500">불러오는 중…</p>}
        {content && <DocsArticle source={content} />}
        <TechPager techs={manifest.techs} currentSlug={fullSlug} />
      </DocsShell>
    </div>
  );
}
