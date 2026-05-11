import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  svgHtml: string;
  onClose: () => void;
}

export function SvgZoomModal({ svgHtml, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [initialScale, setInitialScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startTx: 0, startTy: 0 });

  // Calculate initial scale so SVG viewBox fills the viewport
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const svg = svgWrapRef.current?.querySelector('svg');
      const container = containerRef.current;
      if (!svg || !container) return;

      // Get the SVG's natural (viewBox) dimensions
      const vb = svg.viewBox?.baseVal;
      const naturalW = (vb && vb.width > 0) ? vb.width : null;
      const naturalH = (vb && vb.height > 0) ? vb.height : null;

      // Get the rendered size inside the modal (may be shrunk by CSS width:100%)
      const rendered = svg.getBoundingClientRect();
      const renderedW = rendered.width;
      const renderedH = rendered.height;

      if (!renderedW || !renderedH) return;

      const pad = 48;
      const availW = container.clientWidth - pad * 2;
      const availH = container.clientHeight - pad * 2;

      let fitScale: number;
      if (naturalW && naturalH) {
        // SVG has viewBox: calculate how much to scale so viewBox fills viewport
        // The rendered size is already constrained; we need scale = (viewport / rendered)
        // but capped so we don't exceed viewBox pixel density
        const scaleToFillW = availW / renderedW;
        const scaleToFillH = availH / renderedH;
        fitScale = Math.min(scaleToFillW, scaleToFillH);
      } else {
        // No viewBox: just fill viewport
        fitScale = Math.min(availW / renderedW, availH / renderedH);
      }

      const clamped = Math.max(1, Math.min(8, fitScale));

      setScale(clamped);
      setInitialScale(clamped);
    });
    return () => cancelAnimationFrame(raf);
  }, [svgHtml]);

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
    setScale((s) => Math.min(8, Math.max(0.2, s - e.deltaY * 0.002)));
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
    setScale(initialScale);
    setTranslate({ x: 0, y: 0 });
  }, [initialScale]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-stone-900/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-stone-800/90 text-white shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setScale((s) => Math.min(8, s + 0.25))} className="px-2 py-1 rounded hover:bg-stone-700 text-sm font-mono">+</button>
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
          className="w-full h-full flex items-center justify-center"
          style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transformOrigin: 'center center' }}
        >
          <div
            ref={svgWrapRef}
            className="mermaid-zoom-svg [&>svg]:max-w-none [&>svg]:h-auto bg-white rounded-lg p-4 shadow-lg"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        </div>
      </div>
    </div>
  );
}
