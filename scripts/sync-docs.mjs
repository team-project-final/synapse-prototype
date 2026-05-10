import { mkdtemp, rm, mkdir, copyFile, readdir, stat, writeFile, readFile } from 'node:fs/promises';
import { renderMermaidBlocks } from './lib/mermaid-render.mjs';
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
    await writeFile(join(PUBLIC_DOCS_DIR, destName), rendered, 'utf8');
    copied++;
  }

  console.log(`[sync-docs] copied ${copied} markdown files to public/docs-md/`);
  await rm(tmp, { recursive: true, force: true });
}

main().catch((err) => {
  console.error('[sync-docs] FAILED:', err.message);
  process.exit(1);
});
