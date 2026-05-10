import slugify from 'slugify';

export function shouldSplit({ text, codeCount }) {
  return text.length >= 20000 || codeCount >= 100;
}

export function countCodeBlocks(md) {
  return (md.match(/```/g) ?? []).length / 2;
}

export function splitByH2(markdown) {
  const lines = markdown.split('\n');
  const parts = [];
  let intro = [];
  let current = null;
  for (const line of lines) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current) parts.push(current);
      current = { title: m[1].trim(), body: '' };
      continue;
    }
    if (current) current.body += line + '\n';
    else intro.push(line);
  }
  if (current) parts.push(current);
  return {
    intro: intro.join('\n').trim(),
    parts: parts.map((p) => ({
      ...p,
      slug: slugify(p.title, { lower: true, strict: false, locale: 'ko' }) || 'section',
    })),
  };
}
