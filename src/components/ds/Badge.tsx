import type { ReactNode } from 'react';

type Tone = 'neutral' | 'amber' | 'teal' | 'success' | 'warning' | 'error' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-stone-200 text-stone-700',
  amber: 'bg-[#FEF3C7] text-[#B45309]',
  teal: 'bg-teal-50 text-[#0D9488]',
  success: 'bg-green-50 text-[#16A34A]',
  warning: 'bg-amber-50 text-[#F59E0B]',
  error: 'bg-red-50 text-[#DC2626]',
  info: 'bg-sky-50 text-[#0EA5E9]',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
