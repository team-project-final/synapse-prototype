import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DemoState {
  seeded: boolean;
  setSeeded: (v: boolean) => void;
  reset: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      seeded: false,
      setSeeded: (v) => set({ seeded: v }),
      reset: () => {
        const keys = [
          'synapse:notes',
          'synapse:decks-cards',
          'synapse:reviews',
          'synapse:game',
          'synapse:notifications',
          'synapse:groups',
          'synapse:demo',
        ];
        for (const k of keys) localStorage.removeItem(k);
        set({ seeded: false });
      },
    }),
    { name: 'synapse:demo', storage: createJSONStorage(() => localStorage) },
  ),
);
