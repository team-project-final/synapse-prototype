import { Link } from 'react-router';
import { Badge } from '@/components/ds';
import { getLayerColor, type TechMeta } from '@/lib/tech-manifest';

const SOURCE_DOC = '18_기술_스택_정의서';

export function TechMetaPanel({ tech }: { tech: TechMeta }) {
  const sourceHref = `/docs/${encodeURIComponent(SOURCE_DOC)}#${tech.chunkAnchor}`;
  return (
    <header
      className="mb-8 rounded-md border border-stone-200 bg-white border-l-4"
      style={{ borderLeftColor: getLayerColor(tech.layerSlug) }}
    >
      <div className="px-4 py-3 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <Link to={`/tech#${tech.layerSlug}`} className="text-stone-600 hover:text-[#D97706]">
            {tech.layer}
          </Link>
          {tech.version && <Badge tone="neutral">{tech.version}</Badge>}
        </div>
        <h1 className="display text-3xl text-stone-900">{tech.title}</h1>
        {tech.summary && <p className="text-stone-600">{tech.summary}</p>}
        <Link
          to={sourceHref}
          className="inline-block text-xs text-stone-500 hover:text-[#D97706]"
        >
          출처: 위키 18. 기술 스택 정의서 §{tech.originalSection ?? '—'} →
        </Link>
      </div>
    </header>
  );
}
