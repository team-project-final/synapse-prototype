export interface CorpusEntry {
  noteId: string;
  embedding: number[];
}

export const SEED_CORPUS: CorpusEntry[] = [
  { noteId: 'seed-n1', embedding: [0.9, 0.95, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n2', embedding: [0.95, 0.7, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n3', embedding: [0.85, 0.85, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n4', embedding: [0.8, 0.95, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05] },
  { noteId: 'seed-n5', embedding: [0.8, 0.95, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05] },
  { noteId: 'seed-n6', embedding: [0.7, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2] },
  { noteId: 'seed-n7', embedding: [0.0, 0.0, 0.95, 0.0, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n8', embedding: [0.0, 0.0, 0.0, 0.95, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n9', embedding: [0.0, 0.0, 0.0, 0.85, 0.0, 0.0, 0.0, 0.1] },
  { noteId: 'seed-n10', embedding: [0.0, 0.0, 0.0, 0.85, 0.0, 0.0, 0.0, 0.1] },
];

export function vectorize(query: string): number[] {
  const q = query.toLowerCase();
  const v = [0, 0, 0, 0, 0, 0, 0, 0];
  if (/머신러닝|딥러닝|ml|신경망|뉴럴/.test(q)) v[0] = 1;
  if (/정규화|과적합|드롭아웃|regulariz|overfit|dropout/.test(q)) v[1] = 1;
  if (/네트워크|tcp|udp|http|ip/.test(q)) v[2] = 1;
  if (/패턴|싱글톤|옵저버|팩토리|design pattern/.test(q)) v[3] = 1;
  if (/aws|클라우드|ec2|s3|lambda/.test(q)) v[4] = 1;
  if (/알고리즘|정렬|big-o|자료구조/.test(q)) v[5] = 1;
  if (/sql|database|db|postgres/.test(q)) v[6] = 1;
  v[7] = v.reduce((a, b) => a + b, 0) === 0 ? 1 : 0;
  return v;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    na += (a[i] ?? 0) ** 2;
    nb += (b[i] ?? 0) ** 2;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
