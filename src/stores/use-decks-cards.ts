import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { dueDateFrom, type SrsState } from '@/lib/sm2';

export interface Deck {
  id: string;
  name: string;
  description: string;
}

export type CardStatus = 'new' | 'learning' | 'review';

export interface Card {
  id: string;
  deckId: string;
  type: 'basic' | 'cloze';
  front: string;
  back: string;
  sourceNoteId?: string;
  srs: SrsState & { due: number; lastReviewed: number | null };
  status: CardStatus;
}

export interface CardInput {
  id: string;
  deckId: string;
  type: 'basic' | 'cloze';
  front: string;
  back: string;
  sourceNoteId?: string;
}

interface DecksCardsState {
  decks: Record<string, Deck>;
  cards: Record<string, Card>;
  addDeck: (d: Deck) => void;
  removeDeck: (id: string) => void;
  addCards: (cs: CardInput[]) => void;
  cardsOfDeck: (deckId: string) => Card[];
  dueCardsOfDeck: (deckId: string, now: number) => Card[];
  updateCardSrs: (cardId: string, srs: SrsState, status: CardStatus) => void;
}

export const useDecksCardsStore = create<DecksCardsState>()(
  persist(
    (set, get) => ({
      decks: {},
      cards: {},
      addDeck: (d) => set((s) => ({ decks: { ...s.decks, [d.id]: d } })),
      removeDeck: (id) =>
        set((s) => {
          const decks = { ...s.decks };
          delete decks[id];
          const cards: Record<string, Card> = {};
          for (const [cid, c] of Object.entries(s.cards)) if (c.deckId !== id) cards[cid] = c;
          return { decks, cards };
        }),
      addCards: (cs) =>
        set((s) => {
          const next = { ...s.cards };
          const now = Date.now();
          for (const c of cs) {
            next[c.id] = {
              id: c.id,
              deckId: c.deckId,
              type: c.type,
              front: c.front,
              back: c.back,
              sourceNoteId: c.sourceNoteId,
              srs: { ef: 2.5, interval: 0, repetitions: 0, due: now, lastReviewed: null },
              status: 'new',
            };
          }
          return { cards: next };
        }),
      cardsOfDeck: (deckId) => Object.values(get().cards).filter((c) => c.deckId === deckId),
      dueCardsOfDeck: (deckId, now) =>
        Object.values(get().cards).filter((c) => c.deckId === deckId && c.srs.due <= now),
      updateCardSrs: (cardId, srs, status) =>
        set((s) => {
          const c = s.cards[cardId];
          if (!c) return s;
          const due = dueDateFrom(Date.now(), srs.interval);
          return {
            cards: {
              ...s.cards,
              [cardId]: {
                ...c,
                srs: { ...srs, due, lastReviewed: Date.now() },
                status,
              },
            },
          };
        }),
    }),
    { name: 'synapse:decks-cards', storage: createJSONStorage(() => localStorage) },
  ),
);
