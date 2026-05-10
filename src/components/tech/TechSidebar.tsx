import { Link } from 'react-router';
import { groupTechsByLayer, type TechMeta } from '@/lib/tech-manifest';

interface Props {
  techs: TechMeta[];
  currentSlug?: string;
}

export function TechSidebar({ techs, currentSlug }: Props) {
  const groups = groupTechsByLayer(techs);
  return (
    <nav aria-label="기술 목록" className="space-y-6 text-sm">
      {groups.map((g) => (
        <div key={g.layerSlug}>
          <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-2">{g.layer}</h3>
          <ul className="space-y-1">
            {g.techs.map((t) => {
              const isActive = currentSlug === t.slug;
              return (
                <li key={t.slug}>
                  <Link
                    to={`/tech/${t.slug}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block rounded px-2 py-1 ${
                      isActive
                        ? 'bg-[#FEF3C7] text-[#B45309] font-medium'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {t.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
