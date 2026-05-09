import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type NotificationCategory = 'review' | 'community' | 'achievement' | 'system';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  icon: string;
  createdAt: number;
  read: boolean;
}

interface NotificationsState {
  items: NotificationItem[];
  add: (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (input) =>
        set((s) => ({
          items: [
            { ...input, id: crypto.randomUUID(), createdAt: Date.now(), read: false },
            ...s.items,
          ],
        })),
      markRead: (id) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)) })),
      markAllRead: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
      unreadCount: () => get().items.filter((i) => !i.read).length,
    }),
    { name: 'synapse:notifications', storage: createJSONStorage(() => localStorage) },
  ),
);
