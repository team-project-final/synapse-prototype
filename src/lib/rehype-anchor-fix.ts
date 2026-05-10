import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rehypeAnchorPlugins: any[] = [
  rehypeSlug,
  [
    rehypeAutolinkHeadings,
    {
      behavior: 'append',
      properties: { className: ['heading-anchor'], 'aria-label': '섹션 링크' },
      content: { type: 'text', value: '#' },
    },
  ],
];
