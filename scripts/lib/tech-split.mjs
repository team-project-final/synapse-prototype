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
