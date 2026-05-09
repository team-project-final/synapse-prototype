import { useEffect, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        className="max-w-md w-full rounded-lg bg-stone-50 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id="dialog-title" className="display text-2xl mb-4 text-stone-900">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
