import { type ReactNode } from 'react';

interface Props {
  sidebar: ReactNode;
  toc: ReactNode;
  drawer?: ReactNode;
  children: ReactNode;
}

export function DocsShell({ sidebar, toc, drawer, children }: Props) {
  return (
    <div className="min-h-dvh bg-stone-50">
      {drawer}
      <div className="mx-auto flex max-w-[120rem] gap-8 px-4 lg:px-8">
        <aside className="hidden lg:block w-60 shrink-0 sticky top-16 self-start max-h-[calc(100dvh-4rem)] overflow-y-auto py-8">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1 py-8">{children}</main>
        <aside className="hidden lg:block w-56 shrink-0 sticky top-16 self-start max-h-[calc(100dvh-4rem)] overflow-y-auto py-8">
          {toc}
        </aside>
      </div>
    </div>
  );
}
