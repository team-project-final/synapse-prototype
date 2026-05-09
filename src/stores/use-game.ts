import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { levelFor } from '@/lib/xp';

interface Streak {
  current: number;
  longest: number;
  lastActiveDate: string;
}
interface BadgeRecord {
  earnedAt: number | null;
}

interface GameState {
  xp: number;
  level: number;
  title: string;
  streak: Streak;
  badges: Record<string, BadgeRecord>;
  weeklyStats: { reviewed: number; notesCreated: number; xpGained: number };
  addXp: (amount: number) => { leveledUp: boolean; newLevel: number; oldLevel: number };
  registerActivity: (date: string) => void;
  grantBadge: (id: string) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      title: '학습자',
      streak: { current: 0, longest: 0, lastActiveDate: '' },
      badges: {},
      weeklyStats: { reviewed: 0, notesCreated: 0, xpGained: 0 },
      addXp: (amount) => {
        const oldLevel = get().level;
        const newXp = get().xp + amount;
        const { level, title } = levelFor(newXp);
        set((s) => ({
          xp: newXp,
          level,
          title,
          weeklyStats: { ...s.weeklyStats, xpGained: s.weeklyStats.xpGained + amount },
        }));
        return { leveledUp: level > oldLevel, newLevel: level, oldLevel };
      },
      registerActivity: (date) =>
        set((s) => {
          if (s.streak.lastActiveDate === date) return s;
          const yesterday = new Date(new Date(date).getTime() - 86400000)
            .toISOString()
            .slice(0, 10);
          const isContinuation = s.streak.lastActiveDate === yesterday;
          const current = isContinuation ? s.streak.current + 1 : 1;
          return {
            streak: {
              current,
              longest: Math.max(current, s.streak.longest),
              lastActiveDate: date,
            },
          };
        }),
      grantBadge: (id) =>
        set((s) => ({ badges: { ...s.badges, [id]: { earnedAt: Date.now() } } })),
    }),
    { name: 'synapse:game', storage: createJSONStorage(() => localStorage) },
  ),
);
