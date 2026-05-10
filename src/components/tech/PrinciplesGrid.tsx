import { Card } from '@/components/ds';
import type { Principle } from '@/lib/tech-manifest';

export function PrinciplesGrid({ principles }: { principles: Principle[] }) {
  if (principles.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {principles.map((p) => (
        <Card key={p.title} className="space-y-1">
          <h3 className="display text-base text-stone-900">{p.title}</h3>
          <p className="text-sm text-stone-600">{p.body}</p>
        </Card>
      ))}
    </div>
  );
}
