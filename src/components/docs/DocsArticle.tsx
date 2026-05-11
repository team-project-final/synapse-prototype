import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { rehypeAnchorPlugins } from '@/lib/rehype-anchor-fix';
import { SvgZoomModal } from '@/components/shared/SvgZoomModal';

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
