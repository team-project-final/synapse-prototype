import GithubSlugger from 'github-slugger';

const GROUPS = {
  '01-08': '기획/설계',
  '09-12': '개발 규칙',
  '13-18': '운영/배포',
};

function inferGroup(order) {
  if (order <= 8) return GROUPS['01-08'];
  if (order <= 12) return GROUPS['09-12'];
  return GROUPS['13-18'];
}

export function extractOutline(markdown) {
  const out = [];
  const slugger = new GithubSlugger();
  const re = /^(##{1,2})\s+(.+?)\s*$/gm;
  let m;
  while ((m = re.exec(markdown))) {
    const level = m[1].length;
    if (level !== 2 && level !== 3) continue;
    const text = m[2].trim();
    out.push({ level, text, slug: slugger.slug(text) });
  }
  return out;
}

export function buildManifestEntry(filename, content) {
  const m = /^(\d{2})([a-z]?)_(.+)\.md$/.exec(filename);
  let order = 99;
  if (m) {
    const base = parseInt(m[1], 10);
    const sub = m[2];
    order = sub ? base + (sub.charCodeAt(0) - 96) / 100 : base;
  }
  const slug = filename.replace(/\.md$/, '');
  const titleMatch = /^#\s+(.+?)\s*$/m.exec(content);
  const title = titleMatch ? titleMatch[1].trim() : slug.replace(/_/g, ' ');
  return {
    slug,
    title,
    group: inferGroup(order),
    order,
    outline: extractOutline(content),
  };
}
