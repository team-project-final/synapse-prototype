import GithubSlugger from 'github-slugger';

const GROUPS = {
  '01-08': '기획/설계',
  '09-12': '개발 규칙',
  '13-18': '운영/배포',
};

const ARCH_GROUP = '서비스 아키텍처';

function inferGroup(order) {
  if (order <= 8) return GROUPS['01-08'];
  if (order <= 12) return GROUPS['09-12'];
  return GROUPS['13-18'];
}

/** Map sub-doc prefixes to parent slug and ordering base. */
const SUB_DOC_RE = /^(\d{2})-([A-Z])_(.+)\.md$/;
const ARCH_RE = /^synapse-(.+)_ARCHITECTURE\.md$/;

// Stable ordering for ARCHITECTURE docs (alphabetical fallback)
const ARCH_ORDER = {
  'frontend': 20.01,
  'platform-svc': 20.02,
  'knowledge-svc': 20.03,
  'learning-svc': 20.04,
  'engagement-svc': 20.05,
};

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
  const slug = filename.replace(/\.md$/, '');
  const titleMatch = /^#\s+(.+?)\s*$/m.exec(content);
  const title = titleMatch ? titleMatch[1].trim() : slug.replace(/_/g, ' ');

  // 1) Standard numbered docs: 01_xxx.md, 09a_xxx.md
  const numMatch = /^(\d{2})([a-z]?)_(.+)\.md$/.exec(filename);
  if (numMatch) {
    const base = parseInt(numMatch[1], 10);
    const sub = numMatch[2];
    const order = sub ? base + (sub.charCodeAt(0) - 96) / 100 : base;
    return { slug, title, group: inferGroup(order), order, outline: extractOutline(content) };
  }

  // 2) Sub-docs like 03-A_통신_운영_상세서.md → parent 03, group follows parent
  const subMatch = SUB_DOC_RE.exec(filename);
  if (subMatch) {
    const parentNum = parseInt(subMatch[1], 10);
    const letter = subMatch[2];
    const order = parentNum + (letter.charCodeAt(0) - 64) / 100; // A=0.01, B=0.02 ...
    return {
      slug, title, group: inferGroup(parentNum), order,
      parent: undefined, // rendered in same group, not nested
      outline: extractOutline(content),
    };
  }

  // 3) Service architecture docs: synapse-xxx_ARCHITECTURE.md
  const archMatch = ARCH_RE.exec(filename);
  if (archMatch) {
    const svcName = archMatch[1];
    const order = ARCH_ORDER[svcName] ?? 20.99;
    return { slug, title, group: ARCH_GROUP, order, outline: extractOutline(content) };
  }

  // 4) Fallback
  return { slug, title, group: '운영/배포', order: 99, outline: extractOutline(content) };
}
