import type { NotificationItem } from '@/stores/use-notifications';

const now = Date.now();

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'sn1',
    category: 'achievement',
    icon: '🏆',
    title: '레벨업! 지식 탐험가로 성장했습니다',
    body: '레벨 6 → 레벨 7 달성',
    createdAt: now - 3600000,
    read: false,
  },
  {
    id: 'sn2',
    category: 'community',
    icon: '📚',
    title: 'AWS 자격증 스터디에 새 덱이 공유되었습니다',
    body: '홍길동님이 "EC2 심화" 덱을 공유했습니다',
    createdAt: now - 10800000,
    read: false,
  },
  {
    id: 'sn3',
    category: 'review',
    icon: '🔔',
    title: '오늘 복습할 카드가 25장 있습니다',
    body: 'AWS SAA 덱 외 2개 덱',
    createdAt: now - 28800000,
    read: false,
  },
  {
    id: 'sn4',
    category: 'achievement',
    icon: '🎖',
    title: '배지 획득: "연속 학습 7일"',
    body: '꾸준함이 자산입니다',
    createdAt: now - 86400000,
    read: true,
  },
  {
    id: 'sn5',
    category: 'community',
    icon: '👥',
    title: '김개발님이 스터디 그룹 가입 신청',
    body: '알고리즘 마스터즈 그룹',
    createdAt: now - 86400000 - 7200000,
    read: true,
  },
];
