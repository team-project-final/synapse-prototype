const WIKILINK_RE = /(?<!\\)\[\[([^\]]+?)\]\]/g;

export function extractWikilinks(text: string): string[] {
  const set = new Set<string>();
  for (const m of text.matchAll(WIKILINK_RE)) {
    if (m[1]) set.add(m[1].trim());
  }
  return Array.from(set);
}

export function replaceWikilinks(text: string, render: (target: string) => string): string {
  return text.replace(WIKILINK_RE, (_, target: string) => render(target.trim()));
}
