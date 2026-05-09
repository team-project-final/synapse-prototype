import { describe, it, expect } from 'vitest';
import { rrfMerge } from '../search';

describe('rrfMerge', () => {
  it('combines ranked lists with reciprocal rank fusion', () => {
    const semantic = ['n1', 'n2', 'n3'];
    const keyword = ['n2', 'n3', 'n4'];
    const result = rrfMerge([semantic, keyword], { k: 60 });
    expect(result[0]).toBe('n2');
    expect(result).toContain('n1');
    expect(result).toContain('n4');
  });

  it('handles single source', () => {
    expect(rrfMerge([['a', 'b']], { k: 60 })).toEqual(['a', 'b']);
  });
});
