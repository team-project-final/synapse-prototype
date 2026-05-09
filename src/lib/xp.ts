export interface LevelDef {
  level: number;
  requiredXp: number;
  title: string;
}

export const LEVELS: LevelDef[] = [
  { level: 1, requiredXp: 0, title: '학습자' },
  { level: 2, requiredXp: 100, title: '독서가' },
  { level: 3, requiredXp: 300, title: '필기왕' },
  { level: 4, requiredXp: 700, title: '복습 마스터' },
  { level: 5, requiredXp: 1500, title: '연결자' },
  { level: 6, requiredXp: 2500, title: '지식 수집가' },
  { level: 7, requiredXp: 3000, title: '지식 탐험가' },
  { level: 8, requiredXp: 5000, title: '지식 큐레이터' },
  { level: 9, requiredXp: 7500, title: '지식 건축가' },
  { level: 10, requiredXp: 10000, title: '지식 마에스트로' },
];

export function levelFor(xp: number): { level: number; title: string; nextRequired: number | null } {
  let current = LEVELS[0]!;
  for (const l of LEVELS) {
    if (xp >= l.requiredXp) current = l;
    else break;
  }
  const next = LEVELS.find((l) => l.requiredXp > xp);
  return { level: current.level, title: current.title, nextRequired: next?.requiredXp ?? null };
}

export function xpForReview(): number {
  return 5;
}
export function xpForNoteCreate(): number {
  return 10;
}
export function xpForAiCardAccept(): number {
  return 3;
}

export interface BadgeContext {
  streakCurrent: number;
  totalReviews: number;
  totalNotes: number;
  level: number;
}

export const BADGES = [
  { id: 'first-note', name: '첫 노트', criteria: (c: BadgeContext) => c.totalNotes >= 1 },
  { id: 'first-review', name: '첫 복습', criteria: (c: BadgeContext) => c.totalReviews >= 1 },
  { id: 'streak-7', name: '연속 학습 7일', criteria: (c: BadgeContext) => c.streakCurrent >= 7 },
  { id: 'streak-30', name: '연속 학습 30일', criteria: (c: BadgeContext) => c.streakCurrent >= 30 },
  { id: 'reviews-100', name: '복습 100회', criteria: (c: BadgeContext) => c.totalReviews >= 100 },
  { id: 'notes-50', name: '노트 50개', criteria: (c: BadgeContext) => c.totalNotes >= 50 },
  { id: 'level-5', name: '레벨 5', criteria: (c: BadgeContext) => c.level >= 5 },
  { id: 'level-10', name: '레벨 10', criteria: (c: BadgeContext) => c.level >= 10 },
];

export function evaluateBadges(ctx: BadgeContext): string[] {
  return BADGES.filter((b) => b.criteria(ctx)).map((b) => b.id);
}
