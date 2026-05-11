import { useCallback, useEffect, useRef, useState } from 'react';
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
      {modalOpen && <MermaidModal svgHtml={svgHtml} onClose={() => setModalOpen(false)} />}
    </>
  );
}

function MermaidModal({ svgHtml, onClose }: { svgHtml: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startTx: 0, startTy: 0 });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(5, Math.max(0.2, s - e.deltaY * 0.001)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startTx: translate.x, startTy: translate.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [translate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTranslate({ x: dragRef.current.startTx + dx, y: dragRef.current.startTy + dy });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-stone-900/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-stone-800/90 text-white shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setScale((s) => Math.min(5, s + 0.25))} className="px-2 py-1 rounded hover:bg-stone-700 text-sm font-mono">+</button>
          <span className="text-sm tabular-nums w-16 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.max(0.2, s - 0.25))} className="px-2 py-1 rounded hover:bg-stone-700 text-sm font-mono">−</button>
          <button onClick={resetView} className="px-2 py-1 rounded hover:bg-stone-700 text-xs ml-2">초기화</button>
        </div>
        <div className="text-xs text-stone-400">드래그: 이동 · 스크롤: 확대/축소 · ESC: 닫기</div>
        <button onClick={onClose} className="px-3 py-1 rounded hover:bg-stone-700 text-lg leading-none">✕</button>
      </div>

      {/* SVG viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          ref={contentRef}
          className="w-full h-full flex items-center justify-center"
          style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transformOrigin: 'center center' }}
        >
          <div
            className="[&>svg]:max-w-none [&>svg]:h-auto bg-white rounded-lg p-4 shadow-lg"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        </div>
      </div>
    </div>
  );
}
