const SECTION_RE = /^###\s+1\.(\d+)\b\s*(.*?)\s*$/;
const STOP_H2 = /^##\s+\d/;

export function extractOverview(markdown) {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  let inOverview = false;
  let currentIdx = null;
  const buckets = { 1: [], 2: [], 3: [], 4: [] };
  const headerSeenOverview = /^##\s+1\.\s/;

  for (const line of lines) {
    if (headerSeenOverview.test(line)) {
      inOverview = true;
      currentIdx = null;
      continue;
    }
    if (!inOverview) continue;
    if (STOP_H2.test(line)) break;
    const sub = SECTION_RE.exec(line);
    if (sub) {
      currentIdx = Number(sub[1]);
      continue;
    }
    if (currentIdx && buckets[currentIdx]) buckets[currentIdx].push(line);
  }

  const join = (arr) => arr.join('\n').trim();
  const intro = firstParagraph(join(buckets[1]));
  const diagramHtml = pickFigureBlock(join(buckets[2]));
  const principles = parsePrincipleBullets(join(buckets[3]));
  const tableMd = pickTableBlock(join(buckets[4]));
  const bodyMd = [intro, diagramHtml, '', tableMd].filter(Boolean).join('\n\n');

  if (!intro && !diagramHtml && principles.length === 0 && !tableMd) {
    return { intro: '', diagramHtml: '', principles: [], tableMd: '', bodyMd: '' };
  }
  return { intro, diagramHtml, principles, tableMd, bodyMd };
}

function firstParagraph(text) {
  const lines = text.split('\n');
  const para = [];
  for (const l of lines) {
    if (l.trim() === '') {
      if (para.length) break;
      continue;
    }
    para.push(l.trim());
  }
  return para.join(' ');
}

function pickFigureBlock(text) {
  const m = /<figure[^>]*>[\s\S]*?<\/figure>/.exec(text);
  return m ? m[0] : '';
}

function pickTableBlock(text) {
  const m = /(^\|[^\n]+\|\n\|[\s\-|:]+\|\n(?:\|[^\n]+\|\n?)+)/m.exec(text);
  return m ? m[1].trimEnd() : '';
}

function parsePrincipleBullets(text) {
  const out = [];
  const re = /^-\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/gm;
  let m;
  while ((m = re.exec(text))) {
    out.push({ title: m[1].trim(), body: m[2].trim() });
  }
  return out;
}
