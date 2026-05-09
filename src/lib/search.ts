import MiniSearch from 'minisearch';
import { vectorize, cosine, SEED_CORPUS } from '@/data/search-corpus';
import type { Note } from '@/stores/use-notes';

export function rrfMerge(rankedLists: string[][], opts: { k: number } = { k: 60 }): string[] {
  const scores = new Map<string, number>();
  for (const list of rankedLists) {
    list.forEach((id, idx) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (opts.k + idx + 1));
    });
  }
  return Array.from(scores.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id);
}

export function semanticSearch(query: string, noteIds: string[]): string[] {
  const qv = vectorize(query);
  const scored = SEED_CORPUS.filter((c) => noteIds.includes(c.noteId))
    .map((c) => ({ id: c.noteId, score: cosine(qv, c.embedding) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((s) => s.id);
}

export function keywordSearch(query: string, notes: Note[]): string[] {
  const ms = new MiniSearch<{ id: string; title: string; content: string }>({
    fields: ['title', 'content'],
    storeFields: ['id'],
    searchOptions: { boost: { title: 2 }, fuzzy: 0.2 },
  });
  ms.addAll(notes.map((n) => ({ id: n.id, title: n.title, content: n.contentMd })));
  return ms.search(query).map((r) => String(r.id));
}

export function hybridSearch(query: string, notes: Note[]): string[] {
  const noteIds = notes.map((n) => n.id);
  const sem = semanticSearch(query, noteIds);
  const kw = keywordSearch(query, notes);
  return rrfMerge([sem, kw]);
}
