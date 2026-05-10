import { useEffect, useState } from 'react';

interface Outline {
  level: 2 | 3;
  text: string;
  slug: string;
}
interface Props {
  outline: Outline[];
}

export function DocsTOC({ outline }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (outline.length === 0) return;
    const headings = outline
      .map((o) => document.getElementById(o.slug))
      .filter(Boolean) as HTMLElement[];
    if (headings.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '0px 0px -75% 0px', threshold: 0 },
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [outline]);

  if (outline.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-2">On this page</h3>
      <ul className="space-y-1">
        {outline.map((o) => {
          const active = activeId === o.slug;
          return (
            <li key={o.slug} style={{ paddingLeft: o.level === 3 ? '1.5rem' : 0 }}>
              <a
                href={`#${o.slug}`}
                className={`block py-0.5 transition-colors ${active ? 'text-[#D97706] font-medium' : 'text-stone-600 hover:text-[#D97706]'}`}
              >
                {active && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#D97706]" />}
                {o.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
