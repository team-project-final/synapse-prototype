export interface AICardTemplate {
  front: string;
  back: string;
  type: 'basic' | 'cloze';
}

export const CURATED: Record<string, AICardTemplate[]> = {
  'seed-n1': [
    { type: 'basic', front: '정규화의 목적은?', back: '과적합을 방지하고 일반화 성능 향상' },
    { type: 'basic', front: 'L1과 L2 정규화의 차이?', back: 'L1은 sparse 솔루션 유도, L2는 가중치를 작게 유지' },
    { type: 'basic', front: '드롭아웃이란?', back: '훈련 시 뉴런을 무작위 비활성화하는 정규화 기법' },
    { type: 'cloze', front: '{{c1::Lasso}}는 L1 정규화, {{c2::Ridge}}는 L2 정규화', back: 'Lasso=L1, Ridge=L2' },
    { type: 'basic', front: '정규화 외 과적합 방지법?', back: '교차검증, 더 많은 데이터, early stopping' },
  ],
  'seed-n2': [
    { type: 'basic', front: '과적합이란?', back: '학습 데이터에는 잘 맞지만 일반화 실패하는 현상' },
    { type: 'basic', front: '과적합 해결법은?', back: '정규화, 교차검증, 더 많은 데이터' },
    { type: 'cloze', front: '과적합은 {{c1::학습 데이터}}에는 잘 맞지만 {{c2::일반화}}에 실패', back: '핵심 정의' },
    { type: 'basic', front: '과적합의 원인은?', back: '모델 복잡도가 데이터에 비해 너무 높음' },
    { type: 'basic', front: '과적합 vs 과소적합?', back: '과적합은 학습 데이터에 너무 맞춤, 과소적합은 학습조차 못함' },
  ],
  'seed-n3': [
    { type: 'basic', front: '드롭아웃의 작동 방식?', back: '훈련 시 뉴런을 확률 p로 무작위 비활성화' },
    { type: 'basic', front: '드롭아웃이 정규화에 기여하는 이유는?', back: '뉴런 의존성을 줄여 일반화 성능 향상' },
    { type: 'basic', front: '드롭아웃은 추론(inference) 시 어떻게?', back: '비활성화 없이 모든 뉴런 사용 (가중치 스케일 조정)' },
    { type: 'cloze', front: '드롭아웃의 일반적인 확률은 {{c1::0.5}}', back: '훈련 시 비활성 비율' },
    { type: 'basic', front: '드롭아웃 외 정규화 기법?', back: 'L1, L2, early stopping, 데이터 증강' },
  ],
  'seed-n7': [
    { type: 'basic', front: 'TCP는 연결지향이다 (O/X)', back: 'O' },
    { type: 'basic', front: 'UDP의 장점은?', back: '빠른 속도, 낮은 오버헤드, 실시간성' },
    { type: 'basic', front: 'TCP의 신뢰성 보장 메커니즘은?', back: '시퀀스 번호, ACK, 재전송, 흐름/혼잡 제어' },
    { type: 'basic', front: 'UDP가 유리한 사례?', back: 'DNS, 실시간 영상/음성, 게임' },
    { type: 'cloze', front: '{{c1::TCP}}는 신뢰성, {{c2::UDP}}는 속도', back: 'TCP/UDP 트레이드오프' },
  ],
};

export function generateCardsFromContent(contentMd: string): AICardTemplate[] {
  const headings = [...contentMd.matchAll(/^##\s+(.+?)$/gm)].map((m) => m[1] ?? '');
  const sections = headings.slice(0, 5);
  if (sections.length === 0) {
    return [{ type: 'basic', front: '이 노트의 주요 내용은?', back: contentMd.slice(0, 100) }];
  }
  return sections.map((h) => ({
    type: 'basic' as const,
    front: `${h}이란?`,
    back: extractFirstParagraphAfter(contentMd, h),
  }));
}

function extractFirstParagraphAfter(md: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`##\\s+${escaped}\\s*\\n+([^\\n#]+)`, 'm');
  const m = md.match(re);
  return m?.[1]?.trim() ?? '내용 정리 필요';
}
