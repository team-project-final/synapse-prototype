export type DocMeta = {
  slug: string;
  title: string;
  group: string;
  order: number;
  parent?: string;
  children?: string[];
  outline: { level: 2 | 3; text: string; slug: string }[];
};

let cache: DocMeta[] | null = null;

const BUILD_TS = import.meta.env.VITE_BUILD_TS ?? '';

export async function loadManifest(base: string): Promise<DocMeta[]> {
  if (cache) return cache;
  const bust = BUILD_TS ? `?v=${BUILD_TS}` : '';
  const res = await fetch(`${base}docs-md/manifest.json${bust}`);
  if (!res.ok) throw new Error(`manifest 404 (${res.status})`);
  cache = (await res.json()) as DocMeta[];
  return cache;
}

export function findEntry(manifest: DocMeta[], slug: string): DocMeta | undefined {
  return manifest.find((m) => m.slug === slug);
}

const HIDDEN_FROM_DOCS_SIDEBAR = new Set(['18_기술_스택_정의서']);

export function groupManifest(manifest: DocMeta[]): { group: string; docs: DocMeta[] }[] {
  const map = new Map<string, DocMeta[]>();
  for (const m of manifest) {
    if (m.parent) continue;
    if (HIDDEN_FROM_DOCS_SIDEBAR.has(m.slug)) continue;
    if (!map.has(m.group)) map.set(m.group, []);
    map.get(m.group)!.push(m);
  }
  return [...map.entries()].map(([group, docs]) => ({
    group,
    docs: docs.sort((a, b) => a.order - b.order),
  }));
}
