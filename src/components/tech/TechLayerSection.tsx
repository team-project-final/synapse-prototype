import type { TechMeta } from '@/lib/tech-manifest';
import { TechCard } from './TechCard';

interface Props {
  layer: string;
  layerSlug: string;
  techs: TechMeta[];
}

export function TechLayerSection({ layer, layerSlug, techs }: Props) {
  return (
    <section className="space-y-3">
      <h2 id={layerSlug} className="display text-xl scroll-mt-16">{layer}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {techs.map((t) => (
          <TechCard key={t.slug} tech={t} />
        ))}
      </div>
    </section>
  );
}
