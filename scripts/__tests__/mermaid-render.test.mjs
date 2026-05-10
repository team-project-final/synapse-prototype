import { describe, it, expect } from 'vitest';
import { renderMermaidBlocks } from '../lib/mermaid-render.mjs';

// mmdc spawns Chromium via puppeteer — allow up to 60 s per test
const TEST_TIMEOUT = 60_000;

describe('renderMermaidBlocks', () => {
  it('replaces fenced mermaid blocks with inline svg figure', async () => {
    const md = '# T\n\n```mermaid\nflowchart TD\n  A-->B\n```\n\nafter';
    const out = await renderMermaidBlocks(md);
    expect(out).toContain('<figure class="mermaid-svg">');
    expect(out).toContain('<svg');
    expect(out).not.toContain('```mermaid');
    expect(out).toContain('after');
  }, TEST_TIMEOUT);

  it('keeps non-mermaid code fences untouched', async () => {
    const md = '```ts\nconst x = 1;\n```';
    const out = await renderMermaidBlocks(md);
    expect(out).toBe(md);
  });

  it('falls back to <pre> with warning on parse error', async () => {
    const md = '```mermaid\n>>> not a diagram <<<\n```';
    const out = await renderMermaidBlocks(md);
    expect(out).toContain('<pre data-mermaid-error');
  }, TEST_TIMEOUT);

  it('html-escapes source content in fallback path', async () => {
    const md = '```mermaid\n>>> <script>x</script> <<<\n```';
    const out = await renderMermaidBlocks(md);
    expect(out).toContain('<pre data-mermaid-error');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  }, TEST_TIMEOUT);
});
