import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUPPETEER_CONFIG = join(__dirname, 'puppeteer.config.json');
const MERMAID_CONFIG = join(__dirname, 'mermaid.config.json');

const MERMAID_FENCE_RE = /^ {0,3}`{3,}mermaid\s*\r?\n([\s\S]*?)^ {0,3}`{3,}\s*$/gm;

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Spawn mmdc (mermaid-cli) to render a single diagram string to SVG.
 * Returns the SVG string, or throws on failure.
 */
async function runMmdc(diagramSource) {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mermaid-'));
  const inputPath = join(tmpDir, 'input.mmd');
  const outputPath = join(tmpDir, 'output.svg');

  try {
    await writeFile(inputPath, diagramSource, 'utf8');

    await new Promise((resolve, reject) => {
      const proc = spawn(
        'npx',
        ['mmdc', '-i', inputPath, '-o', outputPath, '-b', 'transparent', '-t', 'default', '-p', PUPPETEER_CONFIG, '-c', MERMAID_CONFIG],
        { stdio: 'pipe', shell: true },
      );

      let stderr = '';
      proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mmdc exited ${code}: ${stderr.trim()}`));
        }
      });

      proc.on('error', (err) => reject(err));
    });

    let svg = await readFile(outputPath, 'utf8');

    // Post-process: make SVG fluid width
    svg = svg
      .replace(/<svg([^>]*)width="[^"]*"/, '<svg$1width="100%"')
      .replace(/<svg([^>]*)height="[^"]*"/, '<svg$1height="auto"')
      .replace(/<svg([^>]*)>/, (match) => {
        if (match.includes('preserveAspectRatio')) return match;
        return match.replace('<svg', '<svg preserveAspectRatio="xMidYMin meet"');
      });

    return svg;
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Replace all ```mermaid ... ``` fenced blocks in a markdown string with
 * inline SVG wrapped in <figure class="mermaid-svg">.
 * Falls back to <pre data-mermaid-error="..."> if rendering fails.
 *
 * @param {string} markdown - Raw markdown text
 * @returns {Promise<string>} - Processed markdown with SVG figures
 */
export async function renderMermaidBlocks(markdown) {
  const matches = [];
  let match;

  // Reset lastIndex before exec loop
  MERMAID_FENCE_RE.lastIndex = 0;
  while ((match = MERMAID_FENCE_RE.exec(markdown)) !== null) {
    matches.push({ full: match[0], source: match[1] });
  }

  if (matches.length === 0) return markdown;

  let result = markdown;

  for (const { full, source } of matches) {
    let replacement;
    try {
      // Normalize CRLF to LF before passing to mmdc
      const svg = await runMmdc(source.replace(/\r\n/g, '\n').trim());
      replacement = `\n\n<figure class="mermaid-svg">\n${svg}\n</figure>\n\n`;
    } catch (err) {
      const escaped = escapeHtml(err.message || 'render error');
      replacement = `\n\n<pre data-mermaid-error="${escaped}">${escapeHtml(source.trim())}</pre>\n\n`;
    }
    // Replace only the first occurrence to avoid double-replacing
    result = result.replace(full, replacement);
  }

  return result;
}
