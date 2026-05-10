import GithubSlugger from 'github-slugger';

const HEADING_RE = /^(?:(\d+(?:\.\d+){0,2})\s+)?(.*?)(?:\s+(\d+(?:\.x|\.[\dx]+)*)(?:\s*\(\s*LTS\s*\))?)?\s*$/;

export function parseTechHeading(text) {
  const m = HEADING_RE.exec(text.trim());
  if (!m) return { originalSection: null, title: text.trim(), version: null };
  const [, section, title, version] = m;
  const isLts = /\(\s*LTS\s*\)\s*$/.test(text);
  return {
    originalSection: section ?? null,
    title: (title ?? '').trim(),
    version: version ? (isLts ? `${version} LTS` : version) : null,
  };
}

const LAYER_MAP = [
  [(h2) => /client/i.test(h2), () => ({ layer: 'Client Layer', layerSlug: 'client' })],
  [(h2) => /gateway/i.test(h2), () => ({ layer: 'Gateway Layer', layerSlug: 'gateway' })],
  [(h2, h3) => /backend/i.test(h2) && /java|spring/i.test(h3 ?? ''), () => ({ layer: 'Backend / Java·Spring', layerSlug: 'backend-java' })],
  [(h2, h3) => /backend/i.test(h2) && /python|fastapi/i.test(h3 ?? ''), () => ({ layer: 'Backend / Python·FastAPI', layerSlug: 'backend-python' })],
  [(h2) => /^data\b/i.test(h2), () => ({ layer: 'Data Layer', layerSlug: 'data' })],
  [(h2) => /ai\/?ml|ai·ml|머신|에이아이/i.test(h2), () => ({ layer: 'AI/ML 레이어', layerSlug: 'aiml' })],
  [(h2) => /인프라|infra/i.test(h2), () => ({ layer: '인프라 레이어', layerSlug: 'infra' })],
  [(h2) => /모니터링|관측|observab/i.test(h2), () => ({ layer: '모니터링 & 관측성 레이어', layerSlug: 'observability' })],
  [(h2) => /외부|external/i.test(h2), () => ({ layer: '외부 서비스 레이어', layerSlug: 'external' })],
];

export function normalizeLayer(h2Text, h3SubText) {
  for (const [pred, build] of LAYER_MAP) {
    if (pred(h2Text, h3SubText)) return build();
  }
  return { layer: h2Text, layerSlug: 'infra' };
}

export function extractSummary(chunkBody) {
  const lines = chunkBody.split('\n');
  const paragraph = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (paragraph.length === 0) {
      if (trimmed === '') continue;
      if (/^(#{1,6}\s|```|<figure|\||-{3,}|>\s)/.test(trimmed)) return '';
      paragraph.push(trimmed);
    } else {
      if (trimmed === '' || /^(#{1,6}\s|```|<figure|\||-{3,}|>\s)/.test(trimmed)) break;
      paragraph.push(trimmed);
    }
  }
  const joined = paragraph.join(' ').replace(/\s+/g, ' ').trim();
  if (joined.length === 0) return '';
  if (joined.length <= 120) return joined;
  return joined.slice(0, 120) + '…';
}

const H2_RE = /^##\s+(.+?)\s*$/;
const H3_RE = /^###\s+(.+?)\s*$/;

function stripSectionPrefix(text) {
  return text.replace(/^\d+(?:\.\d+){0,2}\s+/, '').trim();
}
function countDots(section) {
  if (!section) return 0;
  return (section.match(/\./g) ?? []).length;
}

export function extractTechs(markdown) {
  const lines = markdown.split('\n');
  const layers = [];
  let currentLayer = null;
  let currentH3 = null;

  for (const line of lines) {
    const h2 = H2_RE.exec(line);
    const h3 = H3_RE.exec(line);
    if (h2) {
      if (currentLayer && currentH3) currentLayer.h3Blocks.push(currentH3);
      currentH3 = null;
      const text = h2[1].trim();
      if (/^(?:1\.\s|10\.\s|11\.\s|12\.\s)/.test(text)) {
        currentLayer = null;
        continue;
      }
      currentLayer = { h2Text: stripSectionPrefix(text), h3Blocks: [] };
      layers.push(currentLayer);
      continue;
    }
    if (!currentLayer) continue;
    if (h3) {
      if (currentH3) currentLayer.h3Blocks.push(currentH3);
      currentH3 = { rawHeading: h3[1].trim(), body: '' };
      continue;
    }
    if (currentH3) currentH3.body += line + '\n';
  }
  if (currentLayer && currentH3) currentLayer.h3Blocks.push(currentH3);

  const techs = [];
  const techSlugger = new GithubSlugger();
  const anchorSlugger = new GithubSlugger();

  let layerOrder = 0;
  for (const layer of layers) {
    layerOrder += 1;
    const h3s = layer.h3Blocks;
    const hasNested = h3s.some(
      (b) => countDots(parseTechHeading(b.rawHeading).originalSection) === 2,
    );

    if (!hasNested) {
      let techOrder = 0;
      for (const block of h3s) {
        const meta = parseTechHeading(block.rawHeading);
        techOrder += 1;
        const slugInput = stripSectionPrefix(block.rawHeading).replace(/\./g, '-');
        const slug = techSlugger.slug(slugInput);
        const norm = normalizeLayer(layer.h2Text, null);
        techs.push({
          slug,
          title: meta.title,
          version: meta.version,
          layer: norm.layer,
          layerSlug: norm.layerSlug,
          layerOrder,
          techOrder,
          summary: extractSummary(block.body),
          originalSection: meta.originalSection,
          chunkAnchor: anchorSlugger.slug(block.rawHeading),
          content: block.body.trimEnd() + '\n',
          outline: extractH4Outline(block.body),
        });
      }
    } else {
      let currentSub = null;
      let techOrder = 0;
      for (const block of h3s) {
        const meta = parseTechHeading(block.rawHeading);
        const dots = countDots(meta.originalSection);
        if (dots === 1) {
          currentSub = meta.title;
          techOrder = 0;
          continue;
        }
        if (dots === 2 && currentSub) {
          techOrder += 1;
          const slugInput = stripSectionPrefix(block.rawHeading).replace(/\./g, '-');
          const slug = techSlugger.slug(slugInput);
          const norm = normalizeLayer(layer.h2Text, currentSub);
          techs.push({
            slug,
            title: meta.title,
            version: meta.version,
            layer: norm.layer,
            layerSlug: norm.layerSlug,
            layerOrder,
            techOrder,
            summary: extractSummary(block.body),
            originalSection: meta.originalSection,
            chunkAnchor: anchorSlugger.slug(block.rawHeading),
            content: block.body.trimEnd() + '\n',
            outline: extractH4Outline(block.body),
          });
        }
      }
    }
  }

  return { techs };
}

function extractH4Outline(body) {
  const slugger = new GithubSlugger();
  const out = [];
  const re = /^####\s+(.+?)\s*$/gm;
  let m;
  while ((m = re.exec(body))) {
    const text = m[1].trim();
    out.push({ level: 4, text, slug: slugger.slug(text) });
  }
  return out;
}
