import { NavLink } from 'react-router';
import { groupManifest, type DocMeta } from '@/lib/docs-manifest';

interface Props {
  manifest: DocMeta[];
  currentSlug?: string;
}

export function DocsSidebar({ manifest, currentSlug }: Props) {
  const groups = groupManifest(manifest);
  return (
    <nav aria-label="문서 목록" className="space-y-6 text-sm">
      {groups.map((g) => (
        <div key={g.group}>
          <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-2">{g.group}</h3>
          <ul className="space-y-1">
            {g.docs.map((d) => {
              const isActive = currentSlug === d.slug || currentSlug?.startsWith(`${d.slug}/`);
              return (
                <li key={d.slug}>
                  <NavLink
                    to={`/docs/${d.slug}`}
                    className={`block rounded px-2 py-1 ${isActive ? 'bg-[#FEF3C7] text-[#B45309] font-medium' : 'text-stone-700 hover:bg-stone-100'}`}
                  >
                    {d.title}
                  </NavLink>
                  {d.children && isActive && (
                    <ul className="ml-3 mt-1 space-y-1 border-l border-stone-200 pl-3">
                      {d.children.map((c) => {
                        const child = manifest.find((m) => m.slug === c);
                        if (!child) return null;
                        return (
                          <li key={c}>
                            <NavLink
                              to={`/docs/${c}`}
                              className={({ isActive: a }) =>
                                `block rounded px-2 py-0.5 text-xs ${a ? 'text-[#B45309] font-medium' : 'text-stone-600 hover:text-[#D97706]'}`
                              }
                            >
                              {child.title}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
