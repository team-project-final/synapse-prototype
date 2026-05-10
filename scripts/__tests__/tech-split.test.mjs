import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseTechHeading, extractSummary, normalizeLayer, extractTechs, splitTechDoc } from '../lib/tech-split.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, 'fixtures', 'tech-fixture.md');

describe('parseTechHeading', () => {
  it('extracts section/title/version from "2.1 Flutter 3.x"', () => {
    expect(parseTechHeading('2.1 Flutter 3.x')).toEqual({
      originalSection: '2.1',
      title: 'Flutter',
      version: '3.x',
    });
  });
  it('handles three-number sections like "4.1.1 Java 21 (LTS)"', () => {
    expect(parseTechHeading('4.1.1 Java 21 (LTS)')).toEqual({
      originalSection: '4.1.1',
      title: 'Java',
      version: '21 LTS',
    });
  });
  it('returns null version when no version-like trailing token', () => {
    expect(parseTechHeading('5.5 Confluent Schema Registry')).toEqual({
      originalSection: '5.5',
      title: 'Confluent Schema Registry',
      version: null,
    });
  });
  it('returns null originalSection when no number prefix', () => {
    expect(parseTechHeading('Flutter')).toEqual({
      originalSection: null,
      title: 'Flutter',
      version: null,
    });
  });
});

describe('extractSummary', () => {
  it('returns first paragraph trimmed', () => {
    const md = '\n크로스플랫폼 UI 프레임워크.\n\n#### 설치\n';
    expect(extractSummary(md)).toBe('크로스플랫폼 UI 프레임워크.');
  });
  it('caps at 120 chars + ellipsis', () => {
    const long = '가'.repeat(200);
    const md = `\n${long}\n`;
    const out = extractSummary(md);
    expect(out.length).toBe(121);
    expect(out.endsWith('…')).toBe(true);
  });
  it('skips leading blank lines', () => {
    const md = '\n\n\n첫 단락.\n';
    expect(extractSummary(md)).toBe('첫 단락.');
  });
  it('stops before code fence', () => {
    const md = '\n첫 단락.\n\n```js\ncode\n```\n';
    expect(extractSummary(md)).toBe('첫 단락.');
  });
  it('returns empty string when no paragraph', () => {
    expect(extractSummary('\n#### Heading only\n')).toBe('');
  });
});

describe('normalizeLayer', () => {
  it('maps simple layer name', () => {
    expect(normalizeLayer('Client Layer', null)).toEqual({
      layer: 'Client Layer',
      layerSlug: 'client',
    });
  });
  it('maps nested backend java sub-layer', () => {
    expect(normalizeLayer('Backend Services Layer', 'Java/Spring Ecosystem')).toEqual({
      layer: 'Backend / Java·Spring',
      layerSlug: 'backend-java',
    });
  });
  it('maps nested backend python sub-layer', () => {
    expect(normalizeLayer('Backend Services Layer', 'Python/FastAPI Ecosystem')).toEqual({
      layer: 'Backend / Python·FastAPI',
      layerSlug: 'backend-python',
    });
  });
  it('handles korean layers', () => {
    expect(normalizeLayer('AI/ML 레이어', null)).toEqual({
      layer: 'AI/ML 레이어',
      layerSlug: 'aiml',
    });
    expect(normalizeLayer('인프라 레이어', null)).toEqual({
      layer: '인프라 레이어',
      layerSlug: 'infra',
    });
    expect(normalizeLayer('모니터링 & 관측성 레이어', null)).toEqual({
      layer: '모니터링 & 관측성 레이어',
      layerSlug: 'observability',
    });
    expect(normalizeLayer('외부 서비스 레이어', null)).toEqual({
      layer: '외부 서비스 레이어',
      layerSlug: 'external',
    });
  });
  it('falls back to infra for unmapped layer', () => {
    expect(normalizeLayer('Edge Compute Layer', null)).toEqual({
      layer: 'Edge Compute Layer',
      layerSlug: 'infra',
    });
  });
});

describe('extractTechs (fixture)', () => {
  it('emits 5 techs across 3 sub-layers', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const { techs } = extractTechs(md);
    const slugs = techs.map((t) => t.slug);
    expect(slugs).toEqual([
      'flutter-3-x',
      'dart-3-x',
      'java-21-lts',
      'spring-boot-4',
      'python-3-12',
    ]);
  });

  it('assigns layer/layerSlug correctly across simple + nested', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const { techs } = extractTechs(md);
    const t = (s) => techs.find((x) => x.slug === s);
    expect(t('flutter-3-x').layerSlug).toBe('client');
    expect(t('flutter-3-x').layer).toBe('Client Layer');
    expect(t('java-21-lts').layerSlug).toBe('backend-java');
    expect(t('java-21-lts').layer).toBe('Backend / Java·Spring');
    expect(t('python-3-12').layerSlug).toBe('backend-python');
  });

  it('captures version + originalSection + summary', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const { techs } = extractTechs(md);
    const flutter = techs.find((t) => t.slug === 'flutter-3-x');
    expect(flutter.version).toBe('3.x');
    expect(flutter.originalSection).toBe('2.1');
    expect(flutter.summary).toBe('크로스플랫폼 UI 프레임워크.');
  });

  it('preserves chunk content including h4 children', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const { techs } = extractTechs(md);
    const flutter = techs.find((t) => t.slug === 'flutter-3-x');
    expect(flutter.content).toContain('#### 설치');
    expect(flutter.content).toContain('설치 가이드.');
  });

  it('records chunkAnchor matching original h3 slug', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const { techs } = extractTechs(md);
    const flutter = techs.find((t) => t.slug === 'flutter-3-x');
    expect(flutter.chunkAnchor).toBe('21-flutter-3x');
  });
});

describe('splitTechDoc (fixture)', () => {
  it('returns overview + techs + extras + manifest', async () => {
    const md = await readFile(FIXTURE, 'utf8');
    const out = splitTechDoc(md);
    expect(out.overview.principles).toHaveLength(3);
    expect(out.techs).toHaveLength(5);
    expect(out.extras.matrixMd).toContain('| 항목 | 결정 |');
    expect(out.extras.auditMd).toBeNull();
    expect(out.manifest.overview.principles).toHaveLength(3);
    expect(out.manifest.techs[0].slug).toBe('flutter-3-x');
    expect(out.manifest.techs[0]).not.toHaveProperty('content');
    expect(out.manifest.extras).toEqual({ matrixSlug: 'matrix', auditSlug: null });
  });
});
