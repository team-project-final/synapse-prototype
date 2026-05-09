import { describe, it, expect, beforeEach } from 'vitest';
import { useDecksCardsStore } from '../use-decks-cards';

describe('useDecksCardsStore', () => {
  beforeEach(() => useDecksCardsStore.setState({ decks: {}, cards: {} }));

  it('addDeck creates deck', () => {
    const s = useDecksCardsStore.getState();
    s.addDeck({ id: 'd1', name: 'ML', description: '' });
    expect(useDecksCardsStore.getState().decks.d1?.name).toBe('ML');
  });

  it('addCards inserts cards into deck', () => {
    const s = useDecksCardsStore.getState();
    s.addDeck({ id: 'd1', name: 'ML', description: '' });
    s.addCards([{ id: 'c1', deckId: 'd1', type: 'basic', front: 'Q', back: 'A' }]);
    expect(useDecksCardsStore.getState().cards.c1?.deckId).toBe('d1');
  });

  it('cardsOfDeck returns cards filtered by deckId', () => {
    const s = useDecksCardsStore.getState();
    s.addDeck({ id: 'd1', name: '', description: '' });
    s.addDeck({ id: 'd2', name: '', description: '' });
    s.addCards([
      { id: 'c1', deckId: 'd1', type: 'basic', front: '', back: '' },
      { id: 'c2', deckId: 'd2', type: 'basic', front: '', back: '' },
    ]);
    expect(useDecksCardsStore.getState().cardsOfDeck('d1').map((c) => c.id)).toEqual(['c1']);
  });

  it('updateCardSrs updates srs state', () => {
    const s = useDecksCardsStore.getState();
    s.addDeck({ id: 'd1', name: '', description: '' });
    s.addCards([{ id: 'c1', deckId: 'd1', type: 'basic', front: '', back: '' }]);
    s.updateCardSrs('c1', { ef: 2.6, interval: 6, repetitions: 2 }, 'review');
    expect(useDecksCardsStore.getState().cards.c1!.srs.ef).toBe(2.6);
    expect(useDecksCardsStore.getState().cards.c1!.status).toBe('review');
  });
});
