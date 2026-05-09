import { describe, it, expect, beforeEach } from 'vitest';
import { useNotesStore } from '../use-notes';

describe('useNotesStore', () => {
  beforeEach(() => {
    useNotesStore.setState({ notes: {} });
  });

  it('upsert creates note with extracted outgoingLinks', () => {
    useNotesStore.getState().upsert({
      id: 'n1',
      title: 'A',
      contentMd: 'see [[B]] and [[C]]',
      tags: [],
    });
    const note = useNotesStore.getState().notes.n1!;
    expect(note.outgoingLinks).toEqual(expect.arrayContaining(['B', 'C']));
  });

  it('backlinksOf returns notes that link to given title', () => {
    const s = useNotesStore.getState();
    s.upsert({ id: 'n1', title: 'A', contentMd: 'links to [[B]]', tags: [] });
    s.upsert({ id: 'n2', title: 'B', contentMd: 'no links', tags: [] });
    s.upsert({ id: 'n3', title: 'C', contentMd: 'also [[B]]', tags: [] });
    const back = useNotesStore.getState().backlinksOf('B');
    expect(back.map((n) => n.id).sort()).toEqual(['n1', 'n3']);
  });

  it('remove deletes note', () => {
    useNotesStore.getState().upsert({ id: 'n1', title: 'A', contentMd: '', tags: [] });
    useNotesStore.getState().remove('n1');
    expect(useNotesStore.getState().notes.n1).toBeUndefined();
  });
});
