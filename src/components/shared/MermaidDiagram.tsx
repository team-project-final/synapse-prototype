import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables: {
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    primaryColor: '#FEF3C7',
    primaryTextColor: '#292524',
    primaryBorderColor: '#D97706',
    lineColor: '#78716C',
    secondaryColor: '#F5F5F4',
    tertiaryColor: '#FAFAF9',
  },
});

let counter = 0;

export function MermaidDiagram({ source }: { source: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const id = `mermaid-${++counter}`;
    const target = ref.current;
    mermaid
      .render(id, source)
      .then(({ svg }) => {
        if (target) target.innerHTML = svg;
      })
      .catch((err: Error) => {
        if (!target) return;
        const pre = document.createElement('pre');
        pre.className = 'text-xs text-[#DC2626]';
        pre.textContent = `렌더 실패: ${err.message}`;
        target.replaceChildren(pre);
      });
  }, [source]);
  return <div ref={ref} className="my-4 [&>svg]:max-w-full" />;
}
