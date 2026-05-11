import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { rehypeAnchorPlugins } from '@/lib/rehype-anchor-fix';

interface Props {
  source: string;
}

export function DocsArticle({ source }: Props) {
  const articleRef = useRef<HTMLElement>(null);
  const [modalSvg, setModalSvg] = useState<string | null>(null);

  useEffect(() => {
    if (!articleRef.current) return;
    const figures = articleRef.current.querySelectorAll('figure.mermaid-svg');
    const handlers: Array<[Element, () => void]> = [];

    figures.forEach((fig) => {
      fig.classList.add('cursor-pointer', 'group', 'relative');
      fig.setAttribute('title', '클릭하여 확대');

      // Add hover tooltip
      let tooltip = fig.querySelector('.mermaid-zoom-tip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className =
          'mermaid-zoom-tip absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-800/70 text-white text-xs px-2 py-1 rounded pointer-events-none z-10';
        tooltip.textContent = '클릭하여 확대';
        fig.appendChild(tooltip);
      }

      const handler = () => {
        const svg = fig.querySelector('svg');
        if (svg) setModalSvg(svg.outerHTML);
      };
      fig.addEventListener('click', handler);
      handlers.push([fig, handler]);
    });

    return () => {
      handlers.forEach(([el, h]) => el.removeEventListener('click', h));
    };
  }, [source]);

  return (
    <>
      <article ref={articleRef} className="docs-article">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight, ...rehypeAnchorPlugins]}
        >
          {source}
        </ReactMarkdown>
      </article>
      {modalSvg && <SvgZoomModal svgHtml={modalSvg} onClose={() => setModalSvg(null)} />}
    </>
  );
}

function SvgZoomModal({ svgHtml, onClose }: { svgHtml: string; onClose: () => void }) {
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
      <div
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
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
