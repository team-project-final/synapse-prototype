import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { rehypeAnchorPlugins } from '@/lib/rehype-anchor-fix';

interface Props {
  source: string;
}

export function DocsArticle({ source }: Props) {
  return (
    <article className="docs-article">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, ...rehypeAnchorPlugins]}
      >
        {source}
      </ReactMarkdown>
    </article>
  );
}
