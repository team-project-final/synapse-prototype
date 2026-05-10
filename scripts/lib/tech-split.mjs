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
