import { describe, it, expect } from 'vitest';
import { LEVELS, levelFor, xpForReview, evaluateBadges } from '../xp';

describe('levelFor', () => {
  it('returns level 1 for 0 XP', () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(0).title).toBe('학습자');
  });

  it('returns level 7 (지식 탐험가) at 3,240 XP', () => {
    const r = levelFor(3240);
    expect(r.level).toBe(7);
    expect(r.title).toBe('지식 탐험가');
  });

  it('LEVELS table is monotonic', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i]!.requiredXp).toBeGreaterThan(LEVELS[i - 1]!.requiredXp);
    }
  });
});

describe('xpForReview', () => {
  it('grants 5 XP per submitted review', () => {
    expect(xpForReview()).toBe(5);
  });
});

describe('evaluateBadges', () => {
  it('grants 연속학습7 badge when streak >= 7', () => {
    const earned = evaluateBadges({
      streakCurrent: 7,
      totalReviews: 10,
      totalNotes: 5,
      level: 3,
    });
    expect(earned).toContain('streak-7');
  });

  it('grants 첫노트 badge after first note', () => {
    const earned = evaluateBadges({
      streakCurrent: 0,
      totalReviews: 0,
      totalNotes: 1,
      level: 1,
    });
    expect(earned).toContain('first-note');
  });
});
