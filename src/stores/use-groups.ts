import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Group {
  id: string;
  name: string;
  description: string;
  joinType: 'open' | 'approval' | 'invite';
  memberCount: number;
  maxMembers: number;
  sharedDeckCount: number;
  lastActivityAt: number;
  joined: boolean;
}

interface GroupsState {
  groups: Record<string, Group>;
  upsert: (g: Group) => void;
  myGroups: () => Group[];
  exploreGroups: () => Group[];
}

export const useGroupsStore = create<GroupsState>()(
  persist(
    (set, get) => ({
      groups: {},
      upsert: (g) => set((s) => ({ groups: { ...s.groups, [g.id]: g } })),
      myGroups: () => Object.values(get().groups).filter((g) => g.joined),
      exploreGroups: () => Object.values(get().groups).filter((g) => !g.joined),
    }),
    { name: 'synapse:groups', storage: createJSONStorage(() => localStorage) },
  ),
);
