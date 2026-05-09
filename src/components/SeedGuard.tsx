import { useEffect, type ReactNode } from 'react';
import { useDemoStore } from '@/stores/use-demo';
import { useNotesStore } from '@/stores/use-notes';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { useGameStore } from '@/stores/use-game';
import { useNotificationsStore } from '@/stores/use-notifications';
import { useGroupsStore } from '@/stores/use-groups';
import { SEED_NOTES, SEED_DECKS, SEED_CARDS, SEED_GAME, SEED_GROUPS } from '@/data/seed';
import { SEED_NOTIFICATIONS } from '@/data/notifications-seed';

export function SeedGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (useDemoStore.getState().seeded) return;

    useNotesStore.setState({
      notes: Object.fromEntries(SEED_NOTES.map((n) => [n.id, n])),
    });
    useDecksCardsStore.setState({
      decks: Object.fromEntries(SEED_DECKS.map((d) => [d.id, d])),
      cards: Object.fromEntries(SEED_CARDS.map((c) => [c.id, c])),
    });
    useGameStore.setState(SEED_GAME);
    useNotificationsStore.setState({ items: SEED_NOTIFICATIONS });
    useGroupsStore.setState({
      groups: Object.fromEntries(SEED_GROUPS.map((g) => [g.id, g])),
    });
    useDemoStore.getState().setSeeded(true);
  }, []);

  return <>{children}</>;
}
