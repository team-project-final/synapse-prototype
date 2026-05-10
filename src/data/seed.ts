import type { Note } from '@/stores/use-notes';
import type { Deck, Card } from '@/stores/use-decks-cards';
import type { Group } from '@/stores/use-groups';
import { extractWikilinks } from '@/lib/wikilink';
import { dueDateFrom } from '@/lib/sm2';

const now = Date.now();

function note(id: string, title: string, contentMd: string, tags: string[] = []): Note {
  return {
    id,
    title,
    contentMd,
    tags,
    outgoingLinks: extractWikilinks(contentMd),
    createdAt: now - 86400000 * 30,
    updatedAt: now - 86400000,
  };
}

export const SEED_NOTES: Note[] = [
  note(
    'seed-n1',
    'ML 정규화 기법',
    '# ML 정규화 기법\n\n## 개요\n[[과적합]] 방지를 위한 기법들을 정리한다.\n\n## L1 정규화\n[[Lasso]]: 가중치의 절대값 합을 페널티로 부과.\n\n## L2 정규화\n[[Ridge]]: 가중치의 제곱합을 페널티로 부과. [[가중치]]\n\n## [[드롭아웃]]\n훈련 시 뉴런을 무작위 비활성화.',
    ['머신러닝', '정규화'],
  ),
  note(
    'seed-n2',
    '과적합',
    '# 과적합\n\n학습 데이터에 너무 잘 맞는 모델이 일반화 실패.\n해결: [[ML 정규화 기법]], [[교차검증]], 더 많은 데이터.',
    ['머신러닝'],
  ),
  note(
    'seed-n3',
    '드롭아웃',
    '# 드롭아웃\n\n뉴런을 확률적으로 비활성화하는 [[ML 정규화 기법]]. [[과적합]] 방지에 효과적.',
    ['머신러닝'],
  ),
  note(
    'seed-n4',
    'Lasso',
    '# L1 정규화 (Lasso)\n\nL1 페널티는 [[과적합]]을 방지하면서 sparse 솔루션을 유도.',
    ['머신러닝'],
  ),
  note(
    'seed-n5',
    'Ridge',
    '# L2 정규화 (Ridge)\n\nL2 페널티는 [[가중치]]를 작게 유지.',
    ['머신러닝'],
  ),
  note(
    'seed-n6',
    '가중치',
    '# 가중치\n\n뉴럴넷 파라미터. 초기화 방법 (Xavier/He)이 학습에 큰 영향.',
    ['딥러닝'],
  ),
  note(
    'seed-n7',
    'TCP/UDP 비교',
    '# TCP vs UDP\n\nTCP: 연결지향, 신뢰성 보장.\nUDP: 비연결, 빠른 속도.',
    ['네트워크'],
  ),
  note(
    'seed-n8',
    '디자인 패턴',
    '# 디자인 패턴\n\n자주 쓰이는 패턴: [[싱글톤]], [[옵저버 패턴]], [[팩토리 패턴]].',
    ['아키텍처'],
  ),
  note(
    'seed-n9',
    '싱글톤',
    '# 싱글톤\n\n클래스의 인스턴스가 단 하나임을 보장하는 패턴.',
    ['아키텍처'],
  ),
  note(
    'seed-n10',
    '옵저버 패턴',
    '# 옵저버 패턴\n\n상태 변화 시 의존 객체에 자동 통지하는 패턴. [[디자인 패턴]] 참고.',
    ['아키텍처'],
  ),
  note(
    'seed-n11',
    '교차검증',
    '# 교차검증\n\nK-fold cross validation으로 [[과적합]]을 진단. [[ML 정규화 기법]]과 함께 사용.',
    ['머신러닝'],
  ),
  note(
    'seed-n12',
    '팩토리 패턴',
    '# 팩토리 패턴\n\n객체 생성을 캡슐화. [[디자인 패턴]] 일종. [[싱글톤]] 보완용으로도 사용.',
    ['아키텍처'],
  ),
  note(
    'seed-n13',
    'REST API',
    '# REST API\n\nHTTP 메서드 기반 자원 인터페이스. [[GraphQL]]과 비교됨. 멱등성·상태성 고려.',
    ['백엔드', '아키텍처'],
  ),
  note(
    'seed-n14',
    'GraphQL',
    '# GraphQL\n\n단일 endpoint 쿼리 언어. [[REST API]] 대안. over-fetching/under-fetching 해결.',
    ['백엔드', '아키텍처'],
  ),
  note(
    'seed-n15',
    '마이크로서비스',
    '# 마이크로서비스\n\n작은 서비스로 시스템 분해. [[REST API]] 또는 [[GraphQL]]로 통신. [[디자인 패턴]] 영향.',
    ['아키텍처', '백엔드'],
  ),
  note(
    'seed-n16',
    '이진 트리',
    '# 이진 트리\n\n각 노드가 최대 2개 자식. [[해시 테이블]]과 자료구조 비교. [[동적 계획법]]에 활용.',
    ['알고리즘'],
  ),
  note(
    'seed-n17',
    '해시 테이블',
    '# 해시 테이블\n\n키-값 매핑, 평균 O(1). [[이진 트리]] 대안. 충돌 해결 (체이닝/오픈 어드레싱).',
    ['알고리즘'],
  ),
  note(
    'seed-n18',
    '동적 계획법',
    '# 동적 계획법 (DP)\n\n중복 부분 문제 메모이제이션. [[이진 트리]]·그래프 탐색에 응용.',
    ['알고리즘'],
  ),
  note(
    'seed-n19',
    '트랜스포머',
    '# 트랜스포머\n\n[[어텐션 메커니즘]] 기반 모델. NLP/Vision 표준. [[과적합]] 방지에 [[드롭아웃]] 사용.',
    ['딥러닝'],
  ),
  note(
    'seed-n20',
    '어텐션 메커니즘',
    '# 어텐션 메커니즘\n\n입력의 어떤 부분에 집중할지 학습. [[트랜스포머]]의 핵심.',
    ['딥러닝'],
  ),
  note(
    'seed-n21',
    'Docker',
    '# Docker\n\n컨테이너 가상화. [[Kubernetes]]에서 오케스트레이션. [[마이크로서비스]] 배포에 사실상 표준.',
    ['DevOps'],
  ),
  note(
    'seed-n22',
    'Kubernetes',
    '# Kubernetes\n\n[[Docker]] 컨테이너 오케스트레이션. [[마이크로서비스]] 운영 플랫폼.',
    ['DevOps'],
  ),
  note(
    'seed-n23',
    '경사하강법',
    '# 경사하강법\n\n손실 함수 그래디언트로 [[가중치]] 갱신. [[ML 정규화 기법]]·[[드롭아웃]]과 함께 사용. [[트랜스포머]] 학습 기반.',
    ['머신러닝', '딥러닝'],
  ),
  note(
    'seed-n24',
    'CAP 정리',
    '# CAP 정리\n\nConsistency/Availability/Partition tolerance 중 둘만 동시 보장. [[마이크로서비스]]·분산 DB 설계 핵심.',
    ['아키텍처'],
  ),
];

export const SEED_DECKS: Deck[] = [
  { id: 'seed-d1', name: '프로그래밍', description: '언어/패턴 일반' },
  { id: 'seed-d2', name: 'ML 기초', description: '머신러닝 핵심 개념' },
  { id: 'seed-d3', name: 'AWS SAA', description: 'AWS 솔루션 아키텍트 자격증' },
];

function card(
  id: string,
  deckId: string,
  front: string,
  back: string,
  dueOffsetDays: number,
  sourceNoteId?: string,
): Card {
  return {
    id,
    deckId,
    type: 'basic',
    front,
    back,
    sourceNoteId,
    srs: {
      ef: 2.5,
      interval: dueOffsetDays >= 0 ? 0 : Math.abs(dueOffsetDays),
      repetitions: 0,
      due: dueDateFrom(now, dueOffsetDays),
      lastReviewed: null,
    },
    status: dueOffsetDays <= 0 ? 'review' : 'new',
  };
}

export const SEED_CARDS: Card[] = [
  card('seed-c1', 'seed-d1', 'TCP와 UDP의 주요 차이점은?', 'TCP: 연결지향, 신뢰성. UDP: 비연결, 속도.', 0, 'seed-n7'),
  card('seed-c2', 'seed-d1', '싱글톤 패턴이란?', '인스턴스가 단 하나임을 보장하는 디자인 패턴', 0, 'seed-n9'),
  card('seed-c3', 'seed-d1', '옵저버 패턴이란?', '상태 변화 시 의존 객체에 자동 통지하는 패턴', 0, 'seed-n10'),
  card('seed-c4', 'seed-d1', 'REST API의 멱등성이란?', '같은 요청을 여러 번 호출해도 결과가 동일한 성질', 0),
  card('seed-c5', 'seed-d1', '쓰레드와 프로세스 차이?', '프로세스는 자원 단위, 쓰레드는 실행 흐름 단위', 0),
  card('seed-c6', 'seed-d1', 'OOP 4대 원칙은?', '캡슐화, 상속, 다형성, 추상화', 1),
  card('seed-c7', 'seed-d1', 'SQL JOIN 종류는?', 'INNER, LEFT, RIGHT, FULL OUTER', 2),
  card('seed-c8', 'seed-d1', 'Git rebase와 merge 차이?', 'rebase는 선형 history, merge는 병합 커밋 생성', 3),
  card('seed-c9', 'seed-d1', 'HTTP 상태 4xx 의미는?', '클라이언트 측 오류', 5),
  card('seed-c10', 'seed-d1', 'CORS란?', 'Cross-Origin Resource Sharing — 다른 출처 자원 접근 제어', 7),
  card('seed-c11', 'seed-d1', 'Big-O O(n log n) 예시?', 'Merge sort, Heap sort', 14),
  card('seed-c12', 'seed-d1', 'CAP 정리란?', 'Consistency, Availability, Partition tolerance 중 둘만 동시 보장', 30),
  card('seed-c13', 'seed-d2', 'L1 정규화의 효과는?', 'Sparse 솔루션 유도, feature selection 효과', 0, 'seed-n4'),
  card('seed-c14', 'seed-d2', 'L2 정규화의 효과는?', '가중치를 작게 유지하여 과적합 방지', 0, 'seed-n5'),
  card('seed-c15', 'seed-d2', '드롭아웃의 원리는?', '훈련 시 뉴런을 무작위 비활성화하여 정규화 효과', 0, 'seed-n3'),
  card('seed-c16', 'seed-d2', '과적합 정의?', '학습 데이터에는 잘 맞지만 일반화 실패하는 현상', 0, 'seed-n2'),
  card('seed-c17', 'seed-d2', '교차검증의 목적은?', '데이터 활용 극대화 + 일반화 성능 추정', 0),
  card('seed-c18', 'seed-d2', 'Xavier 초기화란?', '입출력 노드 수에 따라 가중치 초기 분산 조정', 0, 'seed-n6'),
  card('seed-c19', 'seed-d2', '경사하강법이란?', '손실 함수를 미분하여 파라미터를 점진 갱신', 0),
  card('seed-c20', 'seed-d2', 'Adam 옵티마이저 특징?', 'Momentum + RMSProp 결합. 적응적 학습률.', 0),
  card('seed-c21', 'seed-d3', 'EC2 인스턴스 타입 m5 c5 r5 차이?', 'm: 범용, c: 컴퓨팅 최적화, r: 메모리 최적화', 0),
  card('seed-c22', 'seed-d3', 'S3 스토리지 클래스?', 'Standard, IA, One Zone-IA, Glacier 등', 0),
  card('seed-c23', 'seed-d3', 'VPC와 서브넷 관계?', 'VPC는 가상 네트워크, 서브넷은 그 안의 IP 범위', 0),
  card('seed-c24', 'seed-d3', 'RDS Multi-AZ 목적?', '고가용성 — 동기 복제로 대기 인스턴스 운영', 0),
  card('seed-c25', 'seed-d3', 'IAM Role과 User 차이?', 'User는 영구 자격, Role은 임시 자격(STS)', 0),
  card('seed-c26', 'seed-d3', 'CloudFront란?', 'AWS의 CDN 서비스', 1),
  card('seed-c27', 'seed-d3', 'Auto Scaling Group 동작?', 'CloudWatch 지표 기반 인스턴스 자동 증감', 2),
  card('seed-c28', 'seed-d3', 'SQS와 SNS 차이?', 'SQS는 큐, SNS는 pub/sub 알림', 5),
  card('seed-c29', 'seed-d3', 'Lambda 콜드 스타트?', '컨테이너 초기화 시 발생하는 첫 호출 지연', 7),
  card('seed-c30', 'seed-d3', 'Route 53 라우팅 정책?', 'Simple, Weighted, Latency, Failover, Geolocation 등', 14),
];

export const SEED_GAME = {
  xp: 3240,
  level: 7,
  title: '지식 탐험가',
  streak: {
    current: 14,
    longest: 21,
    lastActiveDate: new Date(now).toISOString().slice(0, 10),
  },
  badges: {
    'first-note': { earnedAt: now - 86400000 * 30 },
    'first-review': { earnedAt: now - 86400000 * 29 },
    'streak-7': { earnedAt: now - 86400000 * 7 },
    'reviews-100': { earnedAt: now - 86400000 * 14 },
    'level-5': { earnedAt: now - 86400000 * 10 },
  },
  weeklyStats: { reviewed: 152, notesCreated: 8, xpGained: 420 },
};

export const SEED_GROUPS: Group[] = [
  {
    id: 'seed-g1',
    name: 'AWS 자격증 스터디',
    description: 'SAA 준비',
    joinType: 'approval',
    memberCount: 8,
    maxMembers: 20,
    sharedDeckCount: 3,
    lastActivityAt: now - 7200000,
    joined: true,
  },
  {
    id: 'seed-g2',
    name: '알고리즘 마스터즈',
    description: 'PS 함께',
    joinType: 'open',
    memberCount: 15,
    maxMembers: 30,
    sharedDeckCount: 7,
    lastActivityAt: now - 86400000,
    joined: true,
  },
  {
    id: 'seed-g3',
    name: '딥러닝 논문 읽기',
    description: '주 1회 논문',
    joinType: 'invite',
    memberCount: 6,
    maxMembers: 10,
    sharedDeckCount: 2,
    lastActivityAt: now - 86400000 * 2,
    joined: false,
  },
  {
    id: 'seed-g4',
    name: 'Synapse 사용자 모임',
    description: '데일리 학습 공유',
    joinType: 'open',
    memberCount: 42,
    maxMembers: 100,
    sharedDeckCount: 15,
    lastActivityAt: now - 3600000,
    joined: false,
  },
];
