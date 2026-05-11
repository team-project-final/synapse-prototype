import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { SvgZoomModal } from './SvgZoomModal';

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
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const id = `mermaid-${++counter}`;
    const target = ref.current;
    mermaid
      .render(id, source)
      .then(({ svg }) => {
        if (target) {
          target.innerHTML = svg;
          setSvgHtml(svg);
        }
      })
      .catch((err: Error) => {
        if (!target) return;
        const pre = document.createElement('pre');
        pre.className = 'text-xs text-[#DC2626]';
        pre.textContent = `렌더 실패: ${err.message}`;
        target.replaceChildren(pre);
      });
  }, [source]);

  return (
    <>
      <div
        ref={ref}
        className="my-4 [&>svg]:max-w-full cursor-pointer group relative"
        title="클릭하여 확대"
        onClick={() => svgHtml && setModalOpen(true)}
      >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-800/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
          클릭하여 확대
        </div>
      </div>
      {modalOpen && <SvgZoomModal svgHtml={svgHtml} onClose={() => setModalOpen(false)} />}
    </>
  );
}
