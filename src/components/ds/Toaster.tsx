import { useEffect, useState } from 'react';

type Tone = 'info' | 'success' | 'warning' | 'error';
interface ToastItem {
  id: string;
  message: string;
  tone: Tone;
  duration: number;
}

let listeners: Array<(items: ToastItem[]) => void> = [];
let items: ToastItem[] = [];

export function toast(input: { message: string; tone?: Tone; duration?: number }) {
  const item: ToastItem = {
    id: crypto.randomUUID(),
    message: input.message,
    tone: input.tone ?? 'info',
    duration: input.duration ?? 2500,
  };
  items = [...items, item];
  listeners.forEach((l) => l(items));
  setTimeout(() => {
    items = items.filter((i) => i.id !== item.id);
    listeners.forEach((l) => l(items));
  }, item.duration);
}

const toneClass: Record<Tone, string> = {
  info: 'bg-sky-50 text-[#0EA5E9] border-sky-200',
  success: 'bg-green-50 text-[#16A34A] border-green-200',
  warning: 'bg-amber-50 text-[#F59E0B] border-amber-200',
  error: 'bg-red-50 text-[#DC2626] border-red-200',
};

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>(items);
  useEffect(() => {
    const sub = (next: ToastItem[]) => setList([...next]);
    listeners = [...listeners, sub];
    return () => {
      listeners = listeners.filter((l) => l !== sub);
    };
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`rounded-md border px-4 py-2 shadow-md ${toneClass[t.tone]}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
