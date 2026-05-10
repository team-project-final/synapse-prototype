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
