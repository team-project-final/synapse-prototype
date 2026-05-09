import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { extractWikilinks } from '@/lib/wikilink';

export interface Note {
  id: string;
  title: string;
  contentMd: string;
  tags: string[];
  outgoingLinks: string[];
  createdAt: number;
  updatedAt: number;
}

interface NotesState {
  notes: Record<string, Note>;
  upsert: (input: { id: string; title: string; contentMd: string; tags: string[] }) => void;
  remove: (id: string) => void;
  byTag: (tag: string) => Note[];
  backlinksOf: (title: string) => Note[];
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: {},
      upsert: (input) =>
        set((s) => {
          const now = Date.now();
          const existing = s.notes[input.id];
          const note: Note = {
            id: input.id,
            title: input.title,
            contentMd: input.contentMd,
            tags: input.tags,
            outgoingLinks: extractWikilinks(input.contentMd),
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          };
          return { notes: { ...s.notes, [input.id]: note } };
        }),
      remove: (id) =>
        set((s) => {
          const next = { ...s.notes };
          delete next[id];
          return { notes: next };
        }),
      byTag: (tag) => Object.values(get().notes).filter((n) => n.tags.includes(tag)),
      backlinksOf: (title) =>
        Object.values(get().notes).filter((n) => n.outgoingLinks.includes(title)),
    }),
    { name: 'synapse:notes', storage: createJSONStorage(() => localStorage) },
  ),
);
