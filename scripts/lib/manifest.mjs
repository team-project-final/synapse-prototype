import slugify from 'slugify';

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
  const re = /^(##{1,2})\s+(.+?)\s*$/gm;
  let m;
  while ((m = re.exec(markdown))) {
    const level = m[1].length;
    if (level !== 2 && level !== 3) continue;
    const text = m[2].trim();
    out.push({
      level,
      text,
      slug: slugify(text, { lower: true, strict: false, locale: 'ko' }) || 'h',
    });
  }
  return out;
}

export function buildManifestEntry(filename, content) {
  const m = /^(\d{2})_(.+)\.md$/.exec(filename);
  const order = m ? parseInt(m[1], 10) : 99;
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
