import { describe, it, expect } from 'vitest';
import {
  groupTechsByLayer,
  flattenForPager,
  findTechBySlug,
  getLayerColor,
  type TechMeta,
} from '../tech-manifest';

const sample: TechMeta[] = [
  {
    slug: 'flutter-3-x', title: 'Flutter', version: '3.x', layer: 'Client Layer',
    layerSlug: 'client', layerOrder: 1, techOrder: 1, summary: '...',
    outline: [], originalSection: '2.1', chunkAnchor: '21-flutter-3x',
  },
  {
    slug: 'dart-3-x', title: 'Dart', version: '3.x', layer: 'Client Layer',
    layerSlug: 'client', layerOrder: 1, techOrder: 2, summary: '...',
    outline: [], originalSection: '2.2', chunkAnchor: '22-dart-3x',
  },
  {
    slug: 'java-21-lts', title: 'Java', version: '21 LTS', layer: 'Backend / Java·Spring',
    layerSlug: 'backend-java', layerOrder: 3, techOrder: 1, summary: '...',
    outline: [], originalSection: '4.1.1', chunkAnchor: '411-java-21-lts',
  },
];

describe('groupTechsByLayer', () => {
  it('preserves layer order then tech order', () => {
    const groups = groupTechsByLayer(sample);
    expect(groups.map((g) => g.layerSlug)).toEqual(['client', 'backend-java']);
    expect(groups[0]!.techs.map((t) => t.slug)).toEqual(['flutter-3-x', 'dart-3-x']);
  });
});

describe('flattenForPager', () => {
  it('produces single ordered list across layers', () => {
    expect(flattenForPager(sample).map((t) => t.slug)).toEqual([
      'flutter-3-x', 'dart-3-x', 'java-21-lts',
    ]);
  });
});

describe('findTechBySlug', () => {
  it('finds existing tech', () => {
    expect(findTechBySlug(sample, 'dart-3-x')?.title).toBe('Dart');
  });
  it('returns undefined for missing slug', () => {
    expect(findTechBySlug(sample, 'nope')).toBeUndefined();
  });
});

describe('getLayerColor', () => {
  it('returns CSS variable for known slug', () => {
    expect(getLayerColor('client')).toBe('var(--tech-client)');
    expect(getLayerColor('backend-java')).toBe('var(--tech-backend-java)');
  });
  it('falls back to --tech-infra for unknown slug', () => {
    expect(getLayerColor('zzz')).toBe('var(--tech-infra)');
  });
});
