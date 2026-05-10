const cache = new Map<string, string>();

export async function loadDoc(slug: string): Promise<string> {
  if (cache.has(slug)) return cache.get(slug)!;
  const base = import.meta.env.BASE_URL;
  const url = `${base}docs-md/${slug.split('/').map(encodeURIComponent).join('/')}.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`문서를 불러올 수 없습니다: ${slug} (${res.status})`);
  const text = await res.text();
  cache.set(slug, text);
  return text;
}
