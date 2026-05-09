export interface SrsState {
  ef: number;
  interval: number;
  repetitions: number;
}

export type Rating = 1 | 2 | 3 | 4;

const ratingToQ: Record<Rating, number> = { 1: 0, 2: 3, 3: 4, 4: 5 };

export function applyRating(state: SrsState, rating: Rating): SrsState {
  const q = ratingToQ[rating];
  const newEf = Math.max(1.3, state.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (rating === 1) {
    return { ef: newEf, interval: 0, repetitions: 0 };
  }

  const newRep = state.repetitions + 1;
  let newInterval: number;
  if (newRep === 1) newInterval = 1;
  else if (newRep === 2) newInterval = 6;
  else newInterval = Math.round(state.interval * newEf);

  return { ef: newEf, interval: newInterval, repetitions: newRep };
}

export function dueDateFrom(now: number, intervalDays: number): number {
  return now + intervalDays * 86400000;
}
