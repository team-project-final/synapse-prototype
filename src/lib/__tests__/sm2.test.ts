import { describe, it, expect } from 'vitest';
import { applyRating, type SrsState } from '../sm2';

const initial: SrsState = { ef: 2.5, interval: 0, repetitions: 0 };

describe('applyRating (SM-2)', () => {
  it('rating 1 (Again) resets repetitions and sets interval to 0', () => {
    const next = applyRating({ ef: 2.5, interval: 7, repetitions: 3 }, 1);
    expect(next.repetitions).toBe(0);
    expect(next.interval).toBe(0);
    expect(next.ef).toBeLessThan(2.5);
  });

  it('rating 3 (Good) on first repetition gives interval 1', () => {
    const next = applyRating(initial, 3);
    expect(next.repetitions).toBe(1);
    expect(next.interval).toBe(1);
  });

  it('rating 3 (Good) on second repetition gives interval 6', () => {
    const next = applyRating({ ef: 2.5, interval: 1, repetitions: 1 }, 3);
    expect(next.repetitions).toBe(2);
    expect(next.interval).toBe(6);
  });

  it('rating 3 (Good) on subsequent repetition multiplies by EF', () => {
    const state = { ef: 2.5, interval: 6, repetitions: 2 };
    const next = applyRating(state, 3);
    expect(next.repetitions).toBe(3);
    expect(next.interval).toBe(15);
  });

  it('rating 4 (Easy) increases EF', () => {
    const next = applyRating(initial, 4);
    expect(next.ef).toBeGreaterThan(2.5);
  });

  it('EF never drops below 1.3', () => {
    let s = initial;
    for (let i = 0; i < 50; i++) s = applyRating(s, 1);
    expect(s.ef).toBeGreaterThanOrEqual(1.3);
  });
});
