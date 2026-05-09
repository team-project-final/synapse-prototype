import { describe, it, expect, beforeEach } from 'vitest';
import { useReviewsStore } from '../use-reviews';

describe('useReviewsStore', () => {
  beforeEach(() => useReviewsStore.setState({ sessions: {} }));

  it('startSession creates session at index 0 with no ratings', () => {
    useReviewsStore
      .getState()
      .startSession({ id: 's1', deckId: 'd1', cardIds: ['c1', 'c2', 'c3'] });
    const sess = useReviewsStore.getState().sessions.s1!;
    expect(sess.currentIndex).toBe(0);
    expect(sess.ratings).toEqual([]);
    expect(sess.endedAt).toBeNull();
  });

  it('recordRating appends a rating entry', () => {
    const s = useReviewsStore.getState();
    s.startSession({ id: 's1', deckId: 'd1', cardIds: ['c1'] });
    s.recordRating('s1', 'c1', 3, 4500);
    const sess = useReviewsStore.getState().sessions.s1!;
    expect(sess.ratings).toEqual([{ cardId: 'c1', rating: 3, timeMs: 4500 }]);
  });

  it('advance increments currentIndex', () => {
    const s = useReviewsStore.getState();
    s.startSession({ id: 's1', deckId: 'd1', cardIds: ['c1', 'c2'] });
    s.advance('s1');
    expect(useReviewsStore.getState().sessions.s1!.currentIndex).toBe(1);
  });

  it('completeSession sets endedAt timestamp', () => {
    const s = useReviewsStore.getState();
    s.startSession({ id: 's1', deckId: 'd1', cardIds: ['c1'] });
    s.completeSession('s1');
    expect(useReviewsStore.getState().sessions.s1!.endedAt).toBeGreaterThan(0);
  });

  it('actions on unknown session are no-ops', () => {
    const s = useReviewsStore.getState();
    s.recordRating('ghost', 'c1', 3, 0);
    s.advance('ghost');
    s.completeSession('ghost');
    expect(useReviewsStore.getState().sessions.ghost).toBeUndefined();
  });
});
