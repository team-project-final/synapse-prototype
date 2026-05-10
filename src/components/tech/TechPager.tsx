import { Link } from 'react-router';
import { flattenForPager, type TechMeta } from '@/lib/tech-manifest';

interface Props {
  techs: TechMeta[];
  currentSlug: string;
}

export function TechPager({ techs, currentSlug }: Props) {
  const flat = flattenForPager(techs);
  const idx = flat.findIndex((t) => t.slug === currentSlug);
  if (idx === -1) return null;
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;
  return (
    <nav className="mt-12 flex items-stretch justify-between gap-3 border-t border-stone-200 pt-6 text-sm">
      <div className="flex-1">
        {prev && (
          <Link
            to={`/tech/${prev.slug}`}
            className="block rounded-md border border-stone-200 px-3 py-2 hover:border-[#D97706]"
          >
            <span className="block text-xs text-stone-500">← 이전</span>
            <span className="block text-stone-900">{prev.title}</span>
          </Link>
        )}
      </div>
      <div className="flex-1 text-right">
        {next && (
          <Link
            to={`/tech/${next.slug}`}
            className="block rounded-md border border-stone-200 px-3 py-2 hover:border-[#D97706]"
          >
            <span className="block text-xs text-stone-500">다음 →</span>
            <span className="block text-stone-900">{next.title}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
