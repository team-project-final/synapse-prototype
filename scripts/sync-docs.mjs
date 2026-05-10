import { mkdtemp, rm, mkdir, readdir, stat, writeFile, readFile } from 'node:fs/promises';
import { mkdir as mkdirP } from 'node:fs/promises';
import { renderMermaidBlocks } from './lib/mermaid-render.mjs';
import { shouldSplit, countCodeBlocks, splitByH2 } from './lib/split-doc.mjs';
import { buildManifestEntry, extractOutline } from './lib/manifest.mjs';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PUBLIC_DOCS_DIR = join(PROJECT_ROOT, 'public', 'docs-md');

const REPO_URL = process.env.WIKI_REPO_URL ?? 'https://github.com/team-project-final/documents.wiki.git';
const PAT = process.env.WIKI_PAT;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function main() {
  console.log('[sync-docs] start');

  const tmp = await mkdtemp(join(tmpdir(), 'synapse-wiki-'));
  console.log(`[sync-docs] cloning to ${tmp}`);

  const url = PAT ? REPO_URL.replace('https://', `https://${PAT}@`) : REPO_URL;
  try {
    await run('git', ['clone', '--depth', '1', url, tmp]);
  } catch (err) {
    console.warn(`[sync-docs] clone failed: ${err.message}`);
    console.warn('[sync-docs] documents.wiki may be private — set WIKI_PAT env var');
    console.warn('[sync-docs] continuing with empty docs (build will not fail)');
    await mkdir(PUBLIC_DOCS_DIR, { recursive: true });
    return;
  }

  await mkdir(PUBLIC_DOCS_DIR, { recursive: true });

  const entries = await readdir(tmp);
  const manifest = [];
  let copied = 0;

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    if (entry.startsWith('_')) continue;
    const src = join(tmp, entry);
    const s = await stat(src);
    if (!s.isFile()) continue;
    const destName = entry === 'Home.md' ? 'index.md' : entry;

    const raw = await readFile(src, 'utf8');
    const rendered = await renderMermaidBlocks(raw);

    // Skip manifest entry for index.md (home/landing)
    if (destName === 'index.md') {
      await writeFile(join(PUBLIC_DOCS_DIR, destName), rendered, 'utf8');
      copied++;
      continue;
    }

    const baseEntry = buildManifestEntry(destName, rendered);

    if (shouldSplit({ text: raw, codeCount: countCodeBlocks(raw) })) {
      const { intro, parts } = splitByH2(rendered);
      if (parts.length > 0) {
        const parentSlug = baseEntry.slug;
        const parentDir = join(PUBLIC_DOCS_DIR, parentSlug);
        await mkdirP(parentDir, { recursive: true });

        const childSlugs = [];
        const subWrites = [];

        parts.forEach((p, idx) => {
          const i = String(idx + 1).padStart(2, '0');
          const subSlug = `${i}_${p.slug}`;
          childSlugs.push(subSlug);
          const subContent = `# ${p.title}\n\n${p.body.trim()}\n`;
          manifest.push({
            slug: `${parentSlug}/${subSlug}`,
            title: p.title,
            group: baseEntry.group,
            order: baseEntry.order + (idx + 1) / 100,
            parent: parentSlug,
            outline: extractOutline(subContent),
          });
          subWrites.push(writeFile(join(parentDir, `${subSlug}.md`), subContent, 'utf8'));
        });

        await Promise.all(subWrites);

        // Build parent index page with TOC
        const indexLines = [intro, '', '## 목차', ''];
        parts.forEach((p, idx) => {
          const i = String(idx + 1).padStart(2, '0');
          const subSlug = `${i}_${p.slug}`;
          indexLines.push(`- [${p.title}](/synapse-prototype/docs/${parentSlug}/${subSlug})`);
        });
        await writeFile(join(PUBLIC_DOCS_DIR, destName), indexLines.join('\n'), 'utf8');

        manifest.push({ ...baseEntry, children: childSlugs });
        copied++;
        console.log(`[sync-docs] split ${destName} → ${parts.length} sub-pages`);
        continue;
      }
    }

    // Not split — write as-is
    await writeFile(join(PUBLIC_DOCS_DIR, destName), rendered, 'utf8');
    manifest.push(baseEntry);
    copied++;
  }

  // Write manifest.json sorted by order
  manifest.sort((a, b) => a.order - b.order);
  await writeFile(
    join(PUBLIC_DOCS_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  console.log(`[sync-docs] copied ${copied} markdown files to public/docs-md/`);
  console.log(`[sync-docs] manifest: ${manifest.length} entries`);
  await rm(tmp, { recursive: true, force: true });
}

main().catch((err) => {
  console.error('[sync-docs] FAILED:', err.message);
  process.exit(1);
});
