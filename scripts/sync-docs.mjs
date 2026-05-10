import { mkdtemp, rm, mkdir, readdir, stat, writeFile, readFile } from 'node:fs/promises';
import { renderMermaidBlocks } from './lib/mermaid-render.mjs';
import { buildManifestEntry } from './lib/manifest.mjs';
import { splitTechDoc } from './lib/tech-split.mjs';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PUBLIC_DOCS_DIR = join(PROJECT_ROOT, 'public', 'docs-md');
const TECH_DOC_SLUG = '18_기술_스택_정의서';
const TECH_OUT_DIR = join(PUBLIC_DOCS_DIR, 'tech');

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

    await writeFile(join(PUBLIC_DOCS_DIR, destName), rendered, 'utf8');
    manifest.push(buildManifestEntry(destName, rendered));
    copied++;

    if (destName.replace(/\.md$/, '') === TECH_DOC_SLUG) {
      await mkdir(TECH_OUT_DIR, { recursive: true });
      const out = splitTechDoc(rendered);
      for (const t of out.techs) {
        await writeFile(join(TECH_OUT_DIR, `${t.slug}.md`), t.content, 'utf8');
      }
      if (out.overview.bodyMd) {
        await writeFile(join(TECH_OUT_DIR, 'overview.md'), out.overview.bodyMd, 'utf8');
      }
      if (out.extras.matrixMd) {
        await writeFile(join(TECH_OUT_DIR, 'matrix.md'), out.extras.matrixMd, 'utf8');
      }
      if (out.extras.auditMd) {
        await writeFile(join(TECH_OUT_DIR, 'audit.md'), out.extras.auditMd, 'utf8');
      }
      await writeFile(
        join(TECH_OUT_DIR, 'tech-manifest.json'),
        JSON.stringify(out.manifest, null, 2),
        'utf8',
      );
      console.log(`[sync-docs] tech split: ${out.techs.length} techs → ${TECH_OUT_DIR}`);
    }
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
