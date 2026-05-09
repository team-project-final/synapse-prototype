import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Link } from 'react-router';
import { useNotesStore } from '@/stores/use-notes';

const WIKILINK_RE = /\[\[([^\]]+?)\]\]/g;

interface Props {
  source: string;
}

export function MarkdownRenderer({ source }: Props) {
  const allNotes = useNotesStore((s) => Object.values(s.notes));
  const titleToId = new Map(allNotes.map((n) => [n.title, n.id]));

  const processed = source.replace(WIKILINK_RE, (_, target: string) => {
    const id = titleToId.get(target.trim());
    return id ? `[${target}](#wikilink:${id})` : `[${target}](#missing)`;
  });

  return (
    <div className="prose prose-stone max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith('#wikilink:')) {
              return (
                <Link to={`/app/notes/${href.slice(10)}`} className="text-[#D97706] hover:underline">
                  {children}
                </Link>
              );
            }
            if (href === '#missing') {
              return <span className="text-stone-400 italic">{children} (미생성)</span>;
            }
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
