import { Link } from 'react-router';
import { Badge } from '@/components/ds';
import { getLayerColor, type TechMeta } from '@/lib/tech-manifest';

export function TechCard({ tech }: { tech: TechMeta }) {
  return (
    <Link
      to={`/tech/${tech.slug}`}
      className="block rounded-md bg-stone-100 border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeftColor: getLayerColor(tech.layerSlug) }}
    >
      <div className="flex items-baseline gap-2 mb-1">
        <h3 className="display text-lg text-stone-900">{tech.title}</h3>
        {tech.version && <Badge tone="neutral">{tech.version}</Badge>}
      </div>
      <p className="text-sm text-stone-600 line-clamp-2">{tech.summary}</p>
    </Link>
  );
}
