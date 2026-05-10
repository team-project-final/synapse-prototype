import { describe, it, expect } from 'vitest';
import { parseTechHeading, extractSummary } from '../lib/tech-split.mjs';

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
