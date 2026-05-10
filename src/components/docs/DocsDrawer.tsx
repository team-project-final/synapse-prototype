import { useEffect, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function DocsDrawer({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <>
      <div
        aria-hidden
        className={`lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-30 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        aria-label="문서 사이드바"
        className={`lg:hidden fixed top-0 left-0 z-40 h-dvh w-72 bg-stone-50 shadow-xl transition-transform duration-200 overflow-y-auto p-4 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={onClose}
          className="ml-auto mb-4 block rounded-md p-2 hover:bg-stone-100"
          aria-label="닫기"
        >
          ×
        </button>
        {children}
      </aside>
    </>
  );
}
