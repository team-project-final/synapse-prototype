import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../use-game';

describe('useGameStore', () => {
  beforeEach(() =>
    useGameStore.setState({
      xp: 0,
      level: 1,
      title: '학습자',
      streak: { current: 0, longest: 0, lastActiveDate: '' },
      badges: {},
      weeklyStats: { reviewed: 0, notesCreated: 0, xpGained: 0 },
    }),
  );

  it('addXp increases xp and updates level/title when threshold crossed', () => {
    useGameStore.getState().addXp(3000);
    const s = useGameStore.getState();
    expect(s.xp).toBe(3000);
    expect(s.level).toBe(7);
    expect(s.title).toBe('지식 탐험가');
  });

  it('addXp returns levelUp flag when threshold crossed', () => {
    const r = useGameStore.getState().addXp(3000);
    expect(r.leveledUp).toBe(true);
    expect(r.newLevel).toBe(7);
  });

  it('addXp does not levelUp when threshold not crossed', () => {
    const r = useGameStore.getState().addXp(50);
    expect(r.leveledUp).toBe(false);
  });

  it('grantBadge marks badge as earned', () => {
    useGameStore.getState().grantBadge('streak-7');
    expect(useGameStore.getState().badges['streak-7']?.earnedAt).toBeGreaterThan(0);
  });
});
