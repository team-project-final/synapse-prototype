import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Rating } from '@/lib/sm2';

export interface Session {
  id: string;
  deckId: string;
  cardIds: string[];
  currentIndex: number;
  ratings: Array<{ cardId: string; rating: Rating; timeMs: number }>;
  startedAt: number;
  endedAt: number | null;
}

interface ReviewsState {
  sessions: Record<string, Session>;
  startSession: (input: { id: string; deckId: string; cardIds: string[] }) => void;
  recordRating: (sessionId: string, cardId: string, rating: Rating, timeMs: number) => void;
  advance: (sessionId: string) => void;
  completeSession: (sessionId: string) => void;
}

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set) => ({
      sessions: {},
      startSession: ({ id, deckId, cardIds }) =>
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: {
              id,
              deckId,
              cardIds,
              currentIndex: 0,
              ratings: [],
              startedAt: Date.now(),
              endedAt: null,
            },
          },
        })),
      recordRating: (sessionId, cardId, rating, timeMs) =>
        set((s) => {
          const sess = s.sessions[sessionId];
          if (!sess) return s;
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...sess, ratings: [...sess.ratings, { cardId, rating, timeMs }] },
            },
          };
        }),
      advance: (sessionId) =>
        set((s) => {
          const sess = s.sessions[sessionId];
          if (!sess) return s;
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...sess, currentIndex: sess.currentIndex + 1 },
            },
          };
        }),
      completeSession: (sessionId) =>
        set((s) => {
          const sess = s.sessions[sessionId];
          if (!sess) return s;
          return {
            sessions: { ...s.sessions, [sessionId]: { ...sess, endedAt: Date.now() } },
          };
        }),
    }),
    { name: 'synapse:reviews', storage: createJSONStorage(() => localStorage) },
  ),
);
