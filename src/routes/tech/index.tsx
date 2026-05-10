import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { TechHero } from '@/components/tech/TechHero';
import { TechOverviewDiagram } from '@/components/tech/TechOverviewDiagram';
import { PrinciplesGrid } from '@/components/tech/PrinciplesGrid';
import { TechLayerSection } from '@/components/tech/TechLayerSection';
import { AppendixDocs } from '@/components/tech/AppendixDocs';
import { groupTechsByLayer, loadTechManifest, type TechManifest } from '@/lib/tech-manifest';

export default function TechHub() {
  const [manifest, setManifest] = useState<TechManifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTechManifest(import.meta.env.BASE_URL)
      .then(setManifest)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-dvh bg-stone-50">
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-3">
          <h1 className="display text-3xl">기술 스택을 불러올 수 없습니다</h1>
          <p className="text-stone-600">위키 동기화가 필요할 수 있습니다 ({error}).</p>
          <p>
            <Link to="/docs/18_기술_스택_정의서" className="text-[#D97706] underline">
              위키 원본 보기 →
            </Link>
          </p>
        </div>
      </div>
    );
  }
  if (!manifest) {
    return (
      <div className="min-h-dvh bg-stone-50">
        <SiteHeader />
        <p className="max-w-3xl mx-auto px-6 py-12 text-stone-500">불러오는 중…</p>
      </div>
    );
  }

  const groups = groupTechsByLayer(manifest.techs);
  const appendix = [
    manifest.extras.matrixSlug && {
      title: '10. 기술 선택 요약 매트릭스',
      slug: `tech/${manifest.extras.matrixSlug}`,
    },
    manifest.extras.auditSlug && {
      title: '12. 버전 호환성 감사 보고서',
      slug: `tech/${manifest.extras.auditSlug}`,
    },
  ].filter(Boolean) as { title: string; slug: string }[];

  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <TechHero techCount={manifest.techs.length} />

        {manifest.overview.diagramHtml && (
          <section className="space-y-3">
            <h2 className="display text-xl">시스템 아키텍처</h2>
            <TechOverviewDiagram html={manifest.overview.diagramHtml} />
          </section>
        )}

        {manifest.overview.principles.length > 0 && (
          <section className="space-y-3">
            <h2 className="display text-xl">선정 기준</h2>
            <PrinciplesGrid principles={manifest.overview.principles} />
          </section>
        )}

        <section className="space-y-8">
          <h2 className="display text-xl">기술 목록</h2>
          {groups.map((g) => (
            <TechLayerSection
              key={g.layerSlug}
              layer={g.layer}
              layerSlug={g.layerSlug}
              techs={g.techs}
            />
          ))}
        </section>

        {appendix.length > 0 && (
          <section className="space-y-3">
            <h2 className="display text-xl">부록</h2>
            <AppendixDocs items={appendix} />
          </section>
        )}
      </article>
    </div>
  );
}
