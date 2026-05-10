import { describe, it, expect } from 'vitest';
import { parseTechHeading } from '../lib/tech-split.mjs';

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
