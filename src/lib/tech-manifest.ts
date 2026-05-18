export interface Outline {
  level: 4;
  text: string;
  slug: string;
}

export interface TechMeta {
  slug: string;
  title: string;
  version: string | null;
  layer: string;
  layerSlug: string;
  layerOrder: number;
  techOrder: number;
  summary: string;
  outline: Outline[];
  originalSection: string | null;
  chunkAnchor: string;
}

export interface Principle {
  title: string;
  body: string;
}

export interface TechOverview {
  intro: string;
  diagramHtml: string;
  principles: Principle[];
  tableMd: string;
}

export interface TechManifest {
  overview: TechOverview;
  techs: TechMeta[];
  extras: { matrixSlug: string | null; auditSlug: string | null };
}

const KNOWN_LAYERS = new Set([
  'client', 'gateway', 'backend-java', 'backend-python',
  'data', 'aiml', 'infra', 'observability', 'external',
]);

let cache: TechManifest | null = null;

const BUILD_TS = import.meta.env.VITE_BUILD_TS ?? '';

export async function loadTechManifest(base: string): Promise<TechManifest> {
  if (cache) return cache;
  const bust = BUILD_TS ? `?v=${BUILD_TS}` : '';
  const res = await fetch(`${base}docs-md/tech/tech-manifest.json${bust}`);
  if (!res.ok) throw new Error(`tech-manifest 404 (${res.status})`);
  cache = (await res.json()) as TechManifest;
  return cache;
}

export function groupTechsByLayer(
  techs: TechMeta[],
): { layer: string; layerSlug: string; techs: TechMeta[] }[] {
  const map = new Map<
    string,
    { layer: string; layerSlug: string; layerOrder: number; techs: TechMeta[] }
  >();
  for (const t of techs) {
    const cur = map.get(t.layerSlug);
    if (cur) cur.techs.push(t);
    else map.set(t.layerSlug, {
      layer: t.layer,
      layerSlug: t.layerSlug,
      layerOrder: t.layerOrder,
      techs: [t],
    });
  }
  return [...map.values()]
    .sort((a, b) => a.layerOrder - b.layerOrder)
    .map((g) => ({
      layer: g.layer,
      layerSlug: g.layerSlug,
      techs: g.techs.sort((a, b) => a.techOrder - b.techOrder),
    }));
}

export function flattenForPager(techs: TechMeta[]): TechMeta[] {
  return [...techs].sort(
    (a, b) => a.layerOrder - b.layerOrder || a.techOrder - b.techOrder,
  );
}

export function findTechBySlug(techs: TechMeta[], slug: string): TechMeta | undefined {
  return techs.find((t) => t.slug === slug);
}

export function getLayerColor(layerSlug: string): string {
  if (KNOWN_LAYERS.has(layerSlug)) return `var(--tech-${layerSlug})`;
  return 'var(--tech-infra)';
}
